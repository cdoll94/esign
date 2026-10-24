# Simple Life Media e-signature platform

Tina Su's own e-signature platform (Simple Life Media, LLC, d/b/a Simple Life
Coaching, Nevada). A fork of Documenso Community Edition, rebranded, at
**sign.tinasu.com**. Client onboarding (Hi Mama Client Agreement) is the first
use; it is meant for any contract. Tina is non-technical: plain language.

- Repo: github.com/cdoll94/esign (PUBLIC fork; `upstream` = documenso/documenso).
- Hosting: Railway project "E-Signature" (service `esign-web` from this repo's
  `main` via docker/Dockerfile, plus its own `Postgres`). Pushing to `main`
  deploys. It does NOT use the shared Hub Supabase.
- Plan Tina approved (2026-10-24): docs/ESIGN_PLATFORM_BRIEF.md in the
  "(Claude Project) Hi Mama Support Dashboard" repo, plus the plan in that
  session. Phase 1 = the base + our additions below; Phase 2/3 listed there.

## Hard rules

1. **AGPL-3.0:** this code is public; the site footer links to the source
   (`SOURCE_CODE_URL`). Never commit secrets, client data, or documents.
2. **Never enable Documenso Enterprise features** (`packages/ee`, claim flags
   marked `isEnterprise`: email domains, embed authoring, 21 CFR, HIPAA, auth
   portal, CSC/QES, passkey/2FA *action* reauth). They need a paid licence.
3. **Brand:** no Documenso/DocuSign/Dropbox names or look in anything a user
   sees. The name is a setting: `NEXT_PUBLIC_PLATFORM_NAME` /
   `NEXT_PUBLIC_PLATFORM_LEGAL_NAME` (default "Simple Life Media"); Tina has not
   picked a final product name yet.
4. **Secrets:** never print env values, keys, passphrases or codes. Local
   secrets live in `.env` and `.secrets/` (both git-ignored).
5. **Disclosure text:** substantive changes to the consent wording
   (`signing-gate-page.tsx`, `articles.signature-disclosure.tsx`) need a new
   `SIGNING_GATE_DISCLOSURE_VERSION`.
6. **Costs:** quote ongoing $/month for anything new (Tina's rule).

## Our additions on top of Documenso (keep them when merging upstream)

- Signing gate (`packages/lib/server-only/signing-gate`, `/api/signing-gate`,
  `signing-gate-page.tsx`): ESIGN/UETA consent + emailed 6-digit code before a
  recipient sees a document; token PDF routes and completion require it.
- Email delivery tracking: provider message IDs on EMAIL_SENT audit entries;
  signed Resend webhook at `/api/email-events/resend`.
- Approximate IP location on certificate/audit PDFs (DB-IP Lite, downloaded in
  the Dockerfile; `NEXT_PRIVATE_IP_LOCATION_DB_PATH`).
- `NEXT_PRIVATE_TRUSTED_IP_HEADER` (Railway: `x-real-ip`) so audit IPs can't be
  spoofed with X-Forwarded-For.
- Rebrand (logo components, assets, theme colours, email footer, meta).

## Local development

- Node 24 (not the Mac's default 26): `export PATH=/opt/homebrew/opt/node@24/bin:$PATH`.
- Local Postgres 16 db `esign_dev`; Mailpit on :1025/:8025 for email.
- In the Hub session the preview entry is "esign" (.claude/launch.json).
- `npm run typecheck -w @documenso/remix` before every commit;
  `npm run translate` after changing any user-facing text (catalogs).
- Set `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` for `npm ci`.
