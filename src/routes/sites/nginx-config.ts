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
