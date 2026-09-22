# CMS Architecture Boundary

## Selected architecture

**Render Node web service + managed PostgreSQL + object storage + server-side cookie authentication.** This is the least disruptive option because the repository already documents Render Node deployment, Next.js can run without static export, PostgreSQL supports relational constraints and thousands of SEO pages, and managed storage avoids putting binary media in the database.

Vercel plus managed PostgreSQL was rejected for now because it changes the documented hosting assumption and would require selecting additional vendor services. MySQL and MongoDB were rejected because there is no existing dependency or data model reason to prefer them. An external Laravel/Node backend was rejected as a larger operational surface for this project.

The selection is an implementation target, not a claim that production infrastructure is provisioned.

## 10k-page design

Service pages are database rows keyed by the unique `(serviceId, locationId)` pair. Locations are hierarchical entities, but pages are created only through an explicit admin bulk plan. Public URLs will resolve dynamically as `/services/[service]/[location]` after the server runtime is enabled; no `generateStaticParams()` strategy is used for the page matrix.

Admin page lists use server-side pagination with a maximum page size of 100. Bulk creation reports duplicates before creating drafts. AI generation is represented by bounded `AiGenerationJob` rows, defaulting to 25 jobs per batch and three attempts. Jobs are idempotent by page/action/input hash, cancellable, and never publish content.

`lib/page-scale.ts` contains pure planning and quality logic for bulk creation, job batches, content gates, duplicate candidates, cannibalization warnings, and sitemap chunks. `lib/ai-generation.ts` adds retry and accepted-content replacement guards. These functions are database/runtime-ready but are not wired to browser mutations while authentication and PostgreSQL are unavailable.

The future sitemap uses a database-backed index and chunked child sitemaps, with only published/indexable rows. It will not create one static file per page or load all rows into the browser.

## Audit result

The project currently has no database dependency, authentication provider, server route, cookie session, or backend runtime. `next.config.mjs` uses `output: 'export'`, and deployment documentation assumes uploading generated static files. Public service pages read build-time `site-data.ts` and published static builder seeds. Admin and research persistence use browser localStorage.

The deployment target is discoverable as a Render Node recommendation, but no database instance, credentials, authentication provider, or server deployment exists in this workspace. PostgreSQL is selected as the target database because the CMS needs relational foreign keys, unique service/location pages, revisions, and predictable indexed reads.

## Implemented boundary

- `lib/cms-model.ts` defines normalized Service, Location, ServicePage, SEO metadata, FAQ, revision, media, and admin-user contracts.
- `lib/content-repository.ts` defines the production repository surface and a localStorage development adapter.
- `lib/content-migration.ts` provides a dry-run migration planner and JSON backup export. Existing localStorage and `site-data.ts` records are never deleted or overwritten by the planner.
- `lib/auth-boundary.ts` defines the server authentication contract but intentionally throws when called from this static application. Client-side UI hiding is not treated as authentication.
- `prisma/schema.prisma` defines the selected PostgreSQL schema.
- `prisma/migrations/0001_initial_cms/migration.sql` contains the initial migration and indexes. It has not been applied because no database is provisioned.
- The schema includes `ContentBlueprint` and `AiGenerationJob`; job records contain no provider credentials.

## Required production transition

Old: Static export -> generated HTML -> static hosting.

New: Server runtime -> authenticated admin -> database repository -> published content -> dynamic public service and location pages.

Before enabling production CMS behavior, provision PostgreSQL and install Prisma in the deployment branch, then implement the `DatabaseRepositoryFactory`, secure HTTP-only sessions with password hashing or an identity provider, CSRF protection, authorization, rate limiting, and server-side publish transactions. Only the database adapter should be changed; editor business logic should continue using `ContentRepository`.

Required deployment changes: remove `output: 'export'`, verify all public routes under a server runtime, add authenticated server actions/API handlers, configure `DATABASE_URL`, run the migration, bootstrap the first admin through a one-time server command, and deploy object storage for media.

The bootstrap command is `npm run admin:create`. It refuses to run without `DATABASE_URL`, requires a 12-character password, uses a salted Node `scrypt` hash, and does not print the password. Session login and route protection still require the server authentication implementation before the admin is exposed.

## Workflow

AI and research remain temporary until human acceptance. Acceptance should create a `ContentRevision`, save a draft through the repository, and require a separate publish action. Published pages must be queried by service and optional location and drafts must never be returned by public routes.

The current static site cannot provide runtime `/services/[slug]/[location]` database pages, protected preview URLs, dynamic sitemap generation, or real admin authentication. These remain deployment-phase work, not simulated client features.