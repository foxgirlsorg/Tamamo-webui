// Types mirroring the Tamamo admin API JSON. Source of truth: the Go structs in
// tamamo/internal/config, tamamo/internal/stats and tamamo/internal/admin.
// Field names are exactly what the backend sends (snake_case).

export type Action = 'allow' | 'challenge' | 'block'
export type ThemeMode = 'light' | 'dark' | 'auto'
export type PageState = 'checking' | 'success' | 'denied' | 'error'

// ---- /api/state -------------------------------------------------------------

export interface AppState {
  setup_required: boolean
  authenticated: boolean
  username: string
  version: string
  restart_required: boolean
  admin_listen: string
  listen: string
}

// ---- protection, rules, match -----------------------------------------------

export interface Protection {
  enabled: boolean
  difficulty: number
  default_action: Action
  pass_hours: number
  challenge_minutes: number
  bind_ip: boolean
  bind_user_agent: boolean
  cookie_name: string
  cookie_domain: string
  max_failures_per_minute: number
  /** Pages that are never checked at all. Patterns as in rules. */
  unprotected_paths: string[]
  /** Sites (by name or ID) whose passes are accepted here in the X-Tamamo-Pass header. */
  accept_passes_from: string[]
  /** Confirms by reverse DNS that a visitor calling itself a search engine is one. */
  verified_bots: VerifiedBots
  /** Bans visitors who open one of its trap pages. Runs before everything else. */
  honeypot: Honeypot
  /** Checks that run before the rules: bypass headers, then the rate limit, then webhooks. */
  bypass_headers: BypassHeader[]
  rate_limit: RateLimit
  webhooks: Webhook[]
}

export interface VerifiedBots {
  enabled: boolean
  /** What a fake crawler gets. */
  action: 'block' | 'challenge'
}

/** Trap pages: whoever opens one is banned by IP address (IPv6 by /64). */
export interface Honeypot {
  enabled: boolean
  /** Patterns as in rule paths. */
  paths: string[]
  /** How long a ban lasts; 0 = as long as a pass (pass_hours). */
  ban_hours: number
}

/** Requests carrying this secret header skip every check. */
export interface BypassHeader {
  name: string
  header: string
  value: string
}

export interface RateLimit {
  enabled: boolean
  requests: number
  window_seconds: number
  action: 'block' | 'challenge'
  ipv6_prefix: number
  max_ips: number
}

export type OnError = 'continue' | 'challenge' | 'block'

/** An HTTP endpoint Tamamo asks about each request. */
export interface Webhook {
  name: string
  enabled: boolean
  url: string
  timeout_ms: number
  on_error: OnError
  cache_seconds: number
  send_cookies: boolean
}

export interface HeaderMatch {
  name: string
  pattern: string
}

export interface Match {
  paths: string[]
  user_agents: string[]
  ips: string[]
  methods: string[]
  hosts: string[]
  headers: HeaderMatch[]
}

export interface Rule {
  id: string
  name: string
  enabled: boolean
  action: Action
  difficulty: number
  match: Match
  note: string
}

// ---- checking page ----------------------------------------------------------

export interface StateText {
  heading: string
  message: string
}

export interface PageTexts {
  checking: StateText
  success: StateText
  denied: StateText
  error: StateText
}

export interface Palette {
  background: string
  surface: string
  text: string
  muted: string
  accent: string
  accent_text: string
  border: string
  success: string
  danger: string
}

export interface Labels {
  difficulty: string
  speed: string
  time: string
  progress: string
  seconds: string
  minutes: string
  hash_rate: string
  hash_rate_k: string
  hash_rate_m: string
  mascot_alt: string
  cookies_disabled: string
  browser_too_old: string
  data_missing: string
  solver_failed: string
  too_many_attempts: string
  network_error: string
  server_rejected: string
  bad_request: string
  challenge_invalid: string
  challenge_wrong_site: string
  challenge_expired: string
  challenge_wrong_client: string
  proof_wrong: string
  challenge_used: string
  upstream_missing: string
  upstream_down: string
}

export interface PageTranslation {
  title: string
  texts: PageTexts
  retry_label: string
  continue_label: string
  noscript: string
  footer_text: string
  labels: Labels
}

export interface Page {
  title: string
  lang: string
  texts: PageTexts
  retry_label: string
  continue_label: string
  noscript: string
  footer_text: string

  theme_mode: ThemeMode
  light: Palette
  dark: Palette

  font: 'system' | 'serif' | 'rounded' | 'mono' | 'custom'
  custom_font: string
  font_scale: number
  heading_weight: number
  align: 'left' | 'center'

  layout: 'card' | 'split' | 'minimal'
  card_width: number
  radius: number
  card_border: boolean
  card_shadow: boolean

  mascot_show: boolean
  mascot_position: 'top' | 'left' | 'right' | 'bottom'
  mascot_size: number
  mascot_animation: 'none' | 'float' | 'bounce' | 'wiggle'
  mascot_mirror: boolean

  background: 'solid' | 'dots' | 'grid' | 'stripes' | 'image'
  background_blur: number
  background_dim: number

  progress: 'bar' | 'ring' | 'dots' | 'spinner' | 'none'
  show_difficulty: boolean
  show_hash_rate: boolean
  show_elapsed: boolean
  show_percent: boolean

  min_display_ms: number
  success_delay_ms: number
  auto_redirect: boolean
  animations: boolean

  credit_align: 'left' | 'center' | 'right'
  custom_css: string

  /** "auto", or a language code (lang or a key of translations). */
  language: string
  /** Mirrors language === "auto" for older web UI versions. */
  auto_language: boolean
  translations: Record<string, PageTranslation>
  labels: Labels
}

// ---- sites, modules, admin, stats config ------------------------------------

export interface Site {
  /** Derived from the name on save, so it changes on rename. */
  id: string
  name: string
  hosts: string[]
  target: string
  own_protection: boolean
  protection: Protection
  own_rules: boolean
  rules: Rule[]
  own_page: boolean
  page: Page
}

/** One entry of the modules section: switches on a Go module compiled into the build. */
export interface ModuleConfig {
  /** Name of this entry: a-z, 0-9 and dashes. Used in URLs, logs and the data folder. */
  name: string
  /** ID the module registered under, when it differs from the name. */
  module?: string
  enabled: boolean
  /** Site IDs the module applies to; empty means every site. */
  sites: string[]
  on_error: OnError
  settings: Record<string, string>
}

export interface AdminConfig {
  enabled: boolean
  listen: string
  domains: string[]
  /** Proxies in front of the admin API whose X-Forwarded-For says who signs in. */
  trusted_proxies: string[]
  username: string
  session_hours: number
}

export interface ServerConfig {
  listen: string
  target: string
  ip_source: 'remote' | 'x-forwarded-for' | 'x-real-ip' | 'cf-connecting-ip'
  trusted_proxies: string[]
  /** Whether /.tamamo/auth and /.tamamo/forward-auth answer. auto: only while target is empty. */
  auth_endpoints: 'auto' | 'on' | 'off'
  preserve_host: boolean
  insecure_skip_verify: boolean
}

export interface StatsConfig {
  enabled: boolean
  store_ips: boolean
  recent_events: number
}

/** The stored config (GET/PUT /api/config). Secret and password hash are never sent. */
export interface Config {
  server: ServerConfig
  protection: Protection
  rules: Rule[]
  page: Page
  sites: Site[]
  modules: ModuleConfig[]
  admin: AdminConfig
  stats: StatsConfig
}

export interface RulePreset {
  key: string
  label: string
  description: string
  position: 'top' | 'bottom'
  open?: boolean
  rule: Rule
}

export interface ConfigDefaults {
  rules: Rule[]
  page: Page
  presets: RulePreset[]
}

/** Upload slot names accepted by POST/DELETE /api/upload/{slot}. */
export type UploadSlot = 'checking' | 'success' | 'denied' | 'background' | 'favicon'
/** Slot → whether a custom upload replaces the built-in image. */
export type UploadMap = Partial<Record<UploadSlot, boolean>>

/** Setting keys fixed by environment variables, mapped to the variable name. */
export type LockedMap = Record<string, string>

/** GET/PUT /api/config response. */
export interface ConfigResponse {
  config: Config
  /** Config with environment overrides applied (what is running). */
  effective: Config
  locked: LockedMap
  uploads: UploadMap
  defaults: ConfigDefaults
}

// ---- stats ------------------------------------------------------------------

export interface Counters {
  requests: number
  passed: number
  allowed: number
  challenged: number
  solved: number
  failed: number
  blocked: number
}

export interface HourBucket extends Counters {
  /** Unix seconds: the start of the hour or day. */
  t: number
}

export interface Named {
  name: string
  count: number
}

export interface Event {
  time: string
  kind: 'challenge' | 'solve' | 'fail' | 'block' | 'pass' | 'allow' | string
  site: string
  ip: string
  host: string
  path: string
  ua: string
  rule: string
  solve_ms?: number
}

export interface SiteCounters {
  site: string
  last24h: Counters
}

export interface StatsSnapshot {
  since: string
  uptime_seconds: number
  enabled: boolean
  totals: Counters
  last24h: Counters
  /** 24 hourly buckets, oldest first. */
  hours: HourBucket[]
  /** 7 daily buckets, oldest first (UTC). */
  days: HourBucket[]
  avg_solve_ms: number
  top_rules: Named[]
  top_user_agents: Named[]
  top_paths: Named[]
  top_ips: Named[]
  /** Newest first. */
  events: Event[]
  /** Only in the all-sites snapshot. */
  sites?: SiteCounters[]
}

// ---- rule tester, rules file, modules, preview ------------------------------

export interface TestRequest {
  method: string
  host: string
  path: string
  user_agent: string
  ip: string
  headers?: Record<string, string>
}

export interface TestResult {
  rule: { id: string; name: string; action: Action; difficulty: number } | null
  site: { id: string; name: string }
  action: Action
  difficulty: number
  reason: string
}

export interface RulesFile {
  yaml: string
  path: string
}

export type ModuleFieldType = 'text' | 'secret' | 'number' | 'bool' | 'select' | 'textarea' | 'list'

/** One setting a module declares. The settings form is built from these. */
export interface ModuleField {
  name: string
  label: string
  description: string
  type: ModuleFieldType
  default: string
  placeholder: string
  required: boolean
  options: { value: string; label: string }[]
  /** Bounds of a number field; both 0 means none. */
  min: number
  max: number
}

/** A page a module adds to the web UI (shown in a frame). */
export interface ModulePage {
  id: string
  title: string
  path: string
}

/** A module compiled into this build. */
export interface ModuleInfo {
  id: string
  name: string
  description: string
  version: string
  author: string
  homepage: string
  settings: ModuleField[]
  pages: ModulePage[]
  has_ui: boolean
  has_static: boolean
}

/** An enabled, saved module entry that the backend is running. */
export interface RunningModule {
  name: string
  /** ID of the module it runs. */
  module: string
  /** What it hooks into: check, observe, request, response, page, http, admin, background. */
  hooks: string[]
  /** Why its background work could not start, or "". */
  error: string
}

export interface ModulesResponse {
  available: ModuleInfo[]
  running: RunningModule[]
  kit_url: string
  ui_url: string
}

export interface PreviewRequest {
  page?: Page
  state?: PageState
  /** Translation code, or "" for the main texts. */
  lang?: string
  /** Site ID whose modules extend the page, or "" for the default site. */
  site?: string
}
