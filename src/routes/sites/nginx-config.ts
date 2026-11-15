// nginx snippets for the "Use with nginx" dialog (ported from legacy/app.js).
// The config itself stays in English: it is code, not prose.

export const DEFAULT_SITE_PORT = 8923

/** The Tamamo address as nginx sees it, from the listen address (":8923", "0.0.0.0:8923", ...). */
export function tamamoAddress(listen: string): string {
  const m = (listen || `:${DEFAULT_SITE_PORT}`).trim().match(/^(.*):(\d+)$/)
  if (!m) return `http://127.0.0.1:${DEFAULT_SITE_PORT}`
  let host = m[1]
  if (!host || host === '0.0.0.0' || host === '[::]' || host === '::') host = '127.0.0.1'
  return `http://${host}:${m[2]}`
}

const NGX_HEADERS = `        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;`

export function nginxAuthConfig(serverName: string, tamamo: string, appUrl: string): string {
  return `server {
    listen 80;
    server_name ${serverName};

    # Tamamo's own files and the verify endpoint
    location /.tamamo/ {
        proxy_pass ${tamamo};
${NGX_HEADERS}
    }

    # Only nginx itself may ask Tamamo for a verdict.
    location = /.tamamo/auth { return 404; }
    location = /.tamamo/forward-auth { return 404; }

    # Ask Tamamo about every request
    location = /.tamamo-auth {
        internal;
        proxy_pass ${tamamo}/.tamamo/auth;
        proxy_pass_request_body off;
        proxy_set_header Content-Length "";
        proxy_set_header Host $host;
        proxy_set_header X-Original-URI $request_uri;
        proxy_set_header X-Original-Method $request_method;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header User-Agent $http_user_agent;
        proxy_set_header Cookie $http_cookie;
    }

    # Show the checking page or the denied page
    location @tamamo {
        proxy_pass ${tamamo};
        proxy_set_header Host $host;
        proxy_set_header X-Tamamo-Render 1;
        proxy_set_header X-Original-URI $request_uri;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        auth_request /.tamamo-auth;
        error_page 401 403 = @tamamo;
        proxy_pass ${appUrl};
${NGX_HEADERS}
    }
}
`
}

export function nginxProxyConfig(serverName: string, tamamo: string): string {
  return `server {
    listen 80;
    server_name ${serverName};

    # Everything goes through Tamamo, which forwards verified visitors to the app
    location / {
        proxy_pass ${tamamo};
${NGX_HEADERS}
    }
}
`
}

// ---- Caddy and Traefik ----------------------------------------------------------

export type Proxy = 'nginx' | 'caddy' | 'traefik'

/** What differs between the proxies outside the snippet itself. */
export const PROXIES: Record<Proxy, { label: string; directive: string; ipSource: 'x-real-ip' | 'x-forwarded-for' }> = {
  nginx: { label: 'nginx', directive: 'auth_request', ipSource: 'x-real-ip' },
  caddy: { label: 'Caddy', directive: 'forward_auth', ipSource: 'x-forwarded-for' },
  traefik: { label: 'Traefik', directive: 'ForwardAuth', ipSource: 'x-forwarded-for' },
}

const PLACEHOLDER_HOST = 'example.com'

/** "http://127.0.0.1:8923" -> "127.0.0.1:8923": Caddy upstreams are written without the scheme. */
function hostPort(url: string): string {
  return url.replace(/^http:\/\//, '')
}

/** Host names Caddy can use as a site address. A regular expression is not one. */
function caddyHosts(hosts: string[]): string {
  const plain = hosts.filter((h) => !h.startsWith('re:'))
  return (plain.length ? plain : [PLACEHOLDER_HOST]).join(', ')
}

export function caddyAuthConfig(hosts: string[], tamamo: string, appUrl: string): string {
  return `${caddyHosts(hosts)} {
    # Tamamo's own pages, scripts and pictures
    handle /.tamamo/* {
        # Only Caddy itself may ask Tamamo for a verdict.
        @verdict path /.tamamo/auth /.tamamo/forward-auth
        respond @verdict 404

        reverse_proxy ${hostPort(tamamo)}
    }

    # Your site. Tamamo is asked before every request.
    handle {
        forward_auth ${hostPort(tamamo)} {
            uri /.tamamo/forward-auth
        }

        reverse_proxy ${hostPort(appUrl)}
    }
}
`
}

export function caddyProxyConfig(hosts: string[], tamamo: string): string {
  return `${caddyHosts(hosts)} {
    # Everything goes through Tamamo, which forwards verified visitors to the app
    reverse_proxy ${hostPort(tamamo)}
}
`
}

/** A Traefik router rule for the site's host names. */
function traefikRule(hosts: string[]): string {
  const parts = (hosts.length ? hosts : [PLACEHOLDER_HOST]).map((h) => {
    if (h.startsWith('re:')) return `HostRegexp(\`${h.slice(3)}\`)`
    if (h.startsWith('*.')) return `HostRegexp(\`^.+\\.${h.slice(2).replace(/\./g, '\\.')}$\`)`
    return `Host(\`${h}\`)`
  })
  return parts.join(' || ')
}

function traefikPort(tamamo: string): string {
  return tamamo.match(/:(\d+)$/)?.[1] ?? String(DEFAULT_SITE_PORT)
}

export function traefikAuthConfig(hosts: string[], tamamo: string): string {
  const rule = traefikRule(hosts)
  const wrapped = hosts.length > 1 ? `(${rule})` : rule
  return `services:
  tamamo:
    labels:
      - traefik.enable=true
      # Tamamo's own pages, scripts and pictures
      - traefik.http.routers.tamamo.rule=${wrapped} && PathPrefix(\`/.tamamo/\`) && !Path(\`/.tamamo/forward-auth\`) && !Path(\`/.tamamo/auth\`)
      - traefik.http.routers.tamamo.entrypoints=websecure
      - traefik.http.routers.tamamo.tls.certresolver=le
      - traefik.http.services.tamamo.loadbalancer.server.port=${traefikPort(tamamo)}
      # The question Traefik asks before every request
      - traefik.http.middlewares.tamamo.forwardauth.address=${tamamo}/.tamamo/forward-auth

  # Your app: add the last label to the router it already has
  app:
    labels:
      - traefik.enable=true
      - traefik.http.routers.site.rule=${rule}
      - traefik.http.routers.site.entrypoints=websecure
      - traefik.http.routers.site.tls.certresolver=le
      - traefik.http.routers.site.middlewares=tamamo
`
}

export function traefikProxyConfig(hosts: string[], tamamo: string): string {
  return `services:
  tamamo:
    labels:
      - traefik.enable=true
      # Everything goes through Tamamo, which forwards verified visitors to the app
      - traefik.http.routers.site.rule=${traefikRule(hosts)}
      - traefik.http.routers.site.entrypoints=websecure
      - traefik.http.routers.site.tls.certresolver=le
      - traefik.http.services.site.loadbalancer.server.port=${traefikPort(tamamo)}
`
}

/** The address a proxy in the same compose file uses for Tamamo. */
export function composeAddress(listen: string): string {
  const port = (listen || '').trim().match(/:(\d+)$/)?.[1] ?? String(DEFAULT_SITE_PORT)
  return `http://tamamo:${port}`
}
