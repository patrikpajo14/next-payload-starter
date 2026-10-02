# Starter Site: bilingual Next.js + Payload CMS template

## Problem Statement

A developer who wants to start a Next.js site backed by Payload CMS has no clean starter that shows how the two connect. They need a bilingual (Croatian, English) marketing and articles site where every piece of content is edited by Editors in the CMS, with caching that keeps public pages fast, and a worked example of each Next.js ↔ Payload connection (Local API reads, globals, drafts, form write-back).

## Solution

A starter site with a Homepage, an Article List per Category, Article pages, Standalone Articles (including the Contact Page), a Header and a Footer. All content comes from Payload. Visitors browse in Croatian (default) or English under `/hr` and `/en`. Editors manage everything in the Payload admin, in Croatian or English. Public pages are statically generated and regenerated (ISR) whenever an Editor saves.

## User Stories

### Visitor: browsing

1. As a Visitor, I want `/` to send me to the site in my browser's language, so that I read it in the language I prefer.
2. As a Visitor whose browser language is not supported, I want to land on the Croatian site, so that I always get a working page.
3. As a Visitor, I want a language switcher in the Header, so that I can change between Croatian and English.
4. As a Visitor, I want the switcher to take me to the other language's Homepage, so that I never land on a page that doesn't exist in that language.
5. As a Visitor, I want to see a Hero Section with an image and text on the Homepage, so that I understand the site at a glance.
6. As a Visitor, I want a Products Slider on the Homepage, so that I can browse the products on offer.
7. As a Visitor, I want a Solutions Section, so that I can see what the site offers.
8. As a Visitor, I want an FAQ Section, so that I can find answers to common questions.
9. As a Visitor, I want a full-width Banner with text and a call-to-action button, so that I'm led to the Contact Page.
10. As a Visitor, I want the Header and Footer on every Page, so that I can navigate from anywhere.
11. As a Visitor, I want the Article List to show the newest Articles first, so that I see current content.
12. As a Visitor, I want the Article List split into numbered pages (`/hr/clanci/2`), so that long lists load quickly and each page has its own URL.
13. As a Visitor, I want a page number past the end of the list to show a not-found page, so that I'm not shown an empty list.
14. As a Visitor, I want `/hr/clanci/1` to redirect permanently to `/hr/clanci`, so that there is one address for the first page.
15. As a Visitor, I want to open an Article at `/hr/clanci/moj-clanak`, so that I can read it with its cover image and rich text.
16. As a Visitor, I want a Standalone Article such as the privacy policy at `/hr/politika-privatnosti`, so that short, flat URLs work for fixed content.
17. As a Visitor, I want a Draft Article to be invisible to me, so that I only see finished content.
18. As a Visitor, I want a Page with no title in my language to show a not-found page, so that I'm not shown half-empty content.
19. As a Visitor, I want a Section or field with no value in my language to be skipped, so that the rest of the Page still shows.
20. As a Visitor, I want pages to load instantly, so that browsing feels fast.

### Visitor: contact

21. As a Visitor, I want to see the Contact Form on the Contact Page, so that I can send the site owner a message.
22. As a Visitor, I want to enter first name, last name, phone, address, postal code, and message, with email optional, so that the owner can reach me.
23. As a Visitor, I want phone numbers with digits, spaces, `+`, and `-` to be accepted, so that I can enter my number naturally.
24. As a Visitor, I want a postal code that isn't five digits to be rejected with a clear message, so that I can correct it.
25. As a Visitor, I want validation messages in my own language, so that I understand them.
26. As a Visitor, I want to tick a consent checkbox with a link to the privacy policy, so that I agree knowingly.
27. As a Visitor, I want a confirmation after submitting, so that I know the message was received.
28. As a Visitor, I want the form to keep what I typed when validation fails, so that I don't retype it.

### Editor: managing content

29. As an Editor, I want to use the admin in Croatian or English, so that I work in my own language.
30. As an Editor, I want to edit every text and image on the site in the admin, so that no change needs a developer.
31. As an Editor, I want to write each field in Croatian and English, so that the site is bilingual.
32. As an Editor, I want to add, reorder, repeat, and remove Homepage Sections, so that I control the Homepage layout.
33. As an Editor, I want to enter Products Slider and Solutions items inline in the Section, so that I don't manage separate lists.
34. As an Editor, I want to edit the Header navigation and Footer text and links, so that site chrome stays current.
35. As an Editor, I want to create Categories with a localized title, an optional SEO Name, and optional intro text, so that Articles are grouped and addressable.
36. As an Editor, I want a Category without an SEO Name to host Standalone Articles, so that I can publish flat pages.
37. As an Editor, I want to create an Article with title, excerpt, cover image, rich-text body, slug, and publication date, so that I can publish content.
38. As an Editor, I want every Article to belong to exactly one Category, so that its URL is always determined.
39. As an Editor, I want to save an Article as a Draft, so that I can prepare it without publishing.
40. As an Editor, I want publishing an Article to update the public site immediately, so that I see my change live.
41. As an Editor, I want a Draft to stay hidden until I publish it, so that unfinished work never leaks.
42. As an Editor, I want a "show contact form" option on each Article, so that I decide where the form appears.
43. As an Editor, I want an SEO Name or slug that is already used in the same language, a number-only value, or a reserved word (`admin`, `api`) to be rejected, so that URLs never collide.
44. As an Editor, I want to read Contact Submissions in the admin with the Visitor's language, so that I reply in the right language.
45. As an Editor, I want saving Header, Footer, or Homepage content to refresh every Page, so that changes appear everywhere.
46. As an Editor, I want to upload images that are stored in cloud media storage, so that production doesn't depend on server disk.

### Developer

47. As a developer, I want the whole content model in one Payload configuration, so that I can see how the site is shaped.
48. As a developer, I want public reads to go through the Local API, so that the demo shows no HTTP hop between Next.js and Payload.
49. As a developer, I want public queries to enforce access control and Draft status, so that Drafts can't leak through the Local API.
50. As a developer, I want a seed that creates a first Editor, one Homepage with each Section, and the Articles Category, so that a fresh clone shows a working site.
51. As a developer, I want a README with the Neon `DATABASE_URL` setup, so that I can run the site in minutes.
52. As a developer, I want a Docker image of the production build, so that I can run it on a Hetzner server.
53. As a developer, I want automated tests that fail when routing, caching, or access rules break, so that changes are safe.

## Implementation Decisions

- **Routing**: Public routes live under a locale segment (`/hr`, `/en`) with at most two further levels: `/[locale]/[seo_1]/[seo_2]`. `seo_1` is either a Category SEO Name (its Article List) or the slug of a Standalone Article. `seo_2` is either a page number (Article List page N) or an Article slug. The Payload admin is a separate route group with its own layout, and `/admin` and `/api` are excluded from locale handling.
- **Locale detection**: A single request interceptor (`proxy`, which replaces the deprecated middleware in this Next version) redirects `/` and unprefixed paths to `/hr` or `/en` using the Visitor's browser language, defaulting to Croatian. The language switcher links directly to `/hr` or `/en` so the interceptor can't bounce Visitors back. No `hreflang` alternates in v1.
- **Localization**: Payload localization is on from the start, locales `hr` (default) and `en`, with `localized: true` on all translatable fields (changing this later loses data). The admin UI is available in Croatian (default) and English.
- **Missing translations**: Empty Sections or fields are skipped. A Page with no title in the requested Locale returns 404, and an Article with no title in a Locale is also absent from that Locale's Article List. Header, Footer, and Homepage Sections use per-field fallback only where it isn't hiding missing content; the 404 rule takes precedence.
- **Content model**:
  - Globals: `header`, `footer`, `homepage` (an ordered, repeatable blocks field with five Section types: Hero, Products Slider, Solutions, FAQ, Banner; product and solution items are inline).
  - Collections: `categories` (localized title, optional localized SEO Name, optional intro), `articles` (localized title, excerpt, cover image, rich-text body, slug, publication date, required Category, a `showContactForm` boolean, Drafts enabled), `contact-submissions` (first name, last name, optional email, phone, address, postal code, message, consent, locale), `media`, `users` (Editors).
  - No author, categories-as-tags, or product/solution collections in v1.
- **Uniqueness and validation of URL segments**: Category SEO Names and Standalone Article slugs share one namespace per Locale and must be unique within it. Values that are purely numeric or equal to `admin` or `api` are rejected. Article slugs inside a Category with an SEO Name are unique within that Category. These rules are enforced by validation hooks because the database can't express them. Numeric rejection is what lets `[seo_2]` safely treat numbers as page numbers.
- **Pagination**: Page size 9, newest first by publication date. `/…/1` redirects with a real 301 (configured as a `redirects` entry with `statusCode: 301`; `redirect()`/`permanentRedirect()` give 308). A page past the last page is a 404. List pagination is not enumerated at build beyond existing pages; later pages generate on first request and are cached.
- **Rendering and caching**: Classic ISR (no `cacheComponents`). All public pages are statically generated. Payload `afterChange` hooks on Articles, Categories, and the globals call path revalidation, and Header, Footer, and Homepage changes use a shared tag so every Page refreshes. A 1-hour time-based `revalidate` is the safety net. The production build needs `DATABASE_URL` at build time for the static parameter list.
- **Drafts**: Articles only. Public queries must never rely on Local API defaults: they pass `overrideAccess: false` or filter on published status, so Drafts cannot leak. Homepage, Header, and Footer go live on save.
- **Contact Form**: Rendered below the body of any Article whose `showContactForm` is true; the Contact Page is a Standalone Article in the nameless Category. Submitted through a Server Action that validates (required fields, phone with digits/spaces/`+`/`-`, five-digit postal code, required consent) with messages in the Visitor's Locale, rejects a filled honeypot field silently, and writes a Contact Submission with the Locale. Contact Submissions allow public create and no public read.
- **Media**: S3-compatible storage (Cloudflare R2) through Payload's S3 storage adapter in production and the demo; local disk in dev.
- **Database**: Neon Postgres via the Payload Postgres adapter. Dev uses schema push; the first migration is committed once the schema stabilises. Separate Neon branches for dev, test, and production.
- **Deployment**: Demo on Vercel. Production on Hetzner as a single Docker container built from Next `standalone` output; a shared ISR cache handler is needed only when scaling to several instances.
- **Seed**: Creates the first Editor, the Articles Category, a nameless Category with a privacy-policy Standalone Article and a Contact Page, one Homepage with one of each Section, and sample Articles.

## Testing Decisions

- A good test checks external behaviour only: what a Visitor sees (status, redirect, rendered text) or what the Local API permits. It doesn't assert component structure, internal function calls, or cache internals beyond observable response headers.
- **Primary seam: end-to-end over HTTP** with Playwright against a production build (`next build` then `next start`) and a seeded Neon test branch. Covers: language redirect and switcher; Homepage Sections in both Locales; Article List pagination (`/2`, `/1` → 301, out-of-range → 404); Article and Standalone Article pages; 404 for a missing title and for Drafts; skipping empty Sections; Contact Form validation, honeypot, and successful submit; revalidation after an Editor save.
- **Secondary seam: Payload Local API integration tests** with Vitest against the same Neon test branch. Covers only what the browser can't reach cheaply: Contact Submissions (public create, no public read), Draft visibility under `overrideAccess: false`, and the URL segment uniqueness and reserved-value validation.
- **Prior art**: none. The repo has no tests; this spec creates the first two test seams, so setting them up is part of the work.
- The Neon test branch must be reset or reseeded per run, and credentials must be supplied to CI.

## Out of Scope

- Live Preview
- Product pages and Solution pages (their items are inline in Sections)
- `hreflang` alternates and localized SEO metadata beyond basic titles
- Email notifications and rate limiting on the Contact Form
- Per-locale publish status and Drafts on globals
- Shared ISR cache handler and multi-instance deployment
- Categories as filters, tags, and authors
- Search

## Further Notes

- Research: `docs/research/payload-with-nextjs.md` and `docs/research/payload-nextjs-i18n.md`. Both flag unverified points to check during implementation: `cacheComponents` compatibility (avoided here), unique-per-Locale behaviour on Postgres, and exact option names for drafts.
- `sharp: false` in `pnpm-workspace.yaml` disables its build script, which affects image uploads. Check this early.
- Candidate ADRs (not yet written, awaiting your confirmation): two-level URL structure with localized slugs; localization from day one; classic ISR over Cache Components.
- Vocabulary follows `GLOSSARY.md`.
