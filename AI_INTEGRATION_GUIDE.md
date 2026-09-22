# Real AI integration boundary

The current application uses `output: 'export'`. Its browser bundle intentionally uses the mock provider and never receives an API key. `OPENAI_API_KEY` must remain a server-only environment variable.

The future runtime should expose a narrow server endpoint or separate backend adapter that:

1. Authenticates the admin and rate-limits requests.
2. Loads the service record and accepted SEO research server-side.
3. Builds the structured prompt from the research context.
4. Calls the provider with bounded timeout, token and retry limits.
5. Validates the JSON response before returning a temporary suggestion.
6. Logs action, service, provider, result and error category without prompts or secrets.

Suitable deployments include a Next.js server deployment, Node/Express, Laravel, Cloudflare Worker, or Vercel server functions. A static host cannot safely run this boundary. The current `OpenAiProvider` is deliberately disabled until one of those runtimes is deployed.

Accepted content should eventually use `ContentRepository.saveVersion()` and `publish()` so an acceptance creates a revision instead of destroying the previous version. Local storage remains a development adapter only.

The CMS transition has the same boundary: authentication, database access, publishing, dynamic public pages, sitemap generation, and protected preview URLs require a server runtime. See `CMS_ARCHITECTURE.md` for the migration plan.