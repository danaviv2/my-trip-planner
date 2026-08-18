# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start                    # dev server on :3000 (craco, not react-scripts)
npm run build                # production build; CI=false so warnings don't fail it
npm test                     # Jest watch mode
npm test -- --watchAll=false src/App.test.js   # single file, non-interactive
npx eslint src/path/File.js  # lint one file
```

There is effectively **no test suite** — `src/App.test.js` is the CRA stub. Logic is
verified by writing throwaway Node harnesses in the scratchpad that import a slice of
a module and assert against real-world cases plus explicit counter-tests. Several
pure services (`tripGroupingService`, `passengerRightsService`, `tripCostService`,
`ticketConflictService`) are written to be importable this way. Prefer that over
adding to the empty Jest setup, and always include counter-tests: most bugs here were
over-merging or over-matching, which a happy-path test cannot catch.

## Deployment

Live: https://my-trip-planner-ten.vercel.app — Vercel auto-deploys every push to
`main`. Nothing else is needed.

**Verifying which version is actually live** (do this instead of asking for a
screenshot): pages are `React.lazy`, so `main.*.js` alone is not enough. Fetch
`index.html` → extract `main.*.js` → read the chunk map inside it
(`"static/js/"+e+"."+{…}+".chunk.js"`) → fetch all chunks → search. **Hebrew is
`\uXXXX`-escaped in the minified bundle**, so decode before matching, and pick a
marker that is *user-visible text* — code comments are stripped by minification and
searching for one returns a false negative.

`.env` and `.env.production.local` are **not in git**. A fresh clone runs without
keys until they are restored from a backup archive.

## Architecture

React 18 + CRA via craco, MUI v5, Hebrew-first RTL UI with i18n (he/en/es/fr/pt).
Routing is `react-router-dom` v7 with every page lazy-loaded (`src/routes.js`).

### Secrets: the browser never holds a key

Two Vercel serverless functions in `api/` act as key-holding proxies:

- `api/gemini.mjs` — all Gemini traffic. Has a model allow-list so a caller cannot
  pass an arbitrary model through the query string.
- `api/flight-status.mjs` — AeroDataBox via RapidAPI. Sends an explicit
  `User-Agent`; without it the upstream returns 403, which is easy to misdiagnose as
  a subscription problem.

`src/services/geminiClient.js` is the single entry point for Gemini and picks the
route by environment: locally it calls Google directly with `REACT_APP_GEMINI_API_KEY`
so `npm start` works without `vercel dev`; in production it calls `/api/gemini`. The
`NODE_ENV` check is evaluated at build time, so webpack removes the dev branch
entirely and the key is never bundled. Keep that shape when adding providers.

Firebase's web config in `src/firebase.js` is public **by design** — it must reach
the browser. `firestore.rules` is therefore the only real protection, not obscurity.
Read the comments there before changing anything: `users/{userId}/{document=**}`
deliberately covers future sub-collections (a new collection would otherwise be
silently denied), and `groupTrips/{code}` blocks `list` and constrains each writer to
their own vote key.

### Email ingestion pipeline

This is the core feature and spans six files. Data flows:

`googleTokenClient` → `useAutoGmailScan` → `gmailService` → `bookingParserService`
→ `bookingScanService` → `BookingsContext` → `tripGroupingService`

- **`googleTokenClient.js`** uses Google Identity Services, not Firebase auth, to mint
  Gmail tokens. Firebase returns a 1-hour token with no refresh token, forcing a popup
  per scan; GIS can reissue silently (`prompt: ''`) once consent was granted. A token
  expiring is **not** consent being revoked — conflating them permanently disables
  auto-scan.
- **`gmailService.js`** builds the Gmail query (subject keywords, derived from the
  user's real inbox rather than guessed), applies a cheap pre-filter before paying for
  a model call, and extracts the MIME body. Body extraction must not blindly prefer
  `text/plain`: many senders attach a stub plain part ("open in browser") while the
  confirmation lives in HTML.
- **`bookingParserService.js`** holds the Gemini prompt and normalizes the result.
  Most rules in that prompt exist because a specific wrong value reached a user;
  don't trim them.
- **`bookingScanService.js`** parses the body first, then attachments. A thin body
  result must not suppress attachment parsing, and each produced record is stamped
  with `sourceSubject` / `sourceKind`.

### Booking identity (`src/contexts/BookingsContext.js`)

The single most important thing to understand before touching bookings. The same
booking arrives in several emails and each is missing different fields, so **identity
is signal-based, never a hash key** over fields that may be absent:

- `sameSource` — same subject and same attachment means the same document. Strongest
  signal; applies only to types a document yields at most one of
  (`ONE_PER_DOCUMENT`), since one ticket carries several flights.
- `sameFlight` — flight number + date is absolute identity; a record with no date
  contradicts no date.
- Everything else — same type, no contradicting identity/time field, and at least one
  positive agreement. No shared field means *not* the same booking.
- `mergeBookings` unions fields rather than picking a winner, **except** for
  same-document matches, where the later read replaces the earlier one outright.
  Without that exception a wrong stored value survives forever and a parser fix never
  reaches the screen.
- `withoutEmptyRecords`, `withoutCancelled`, `withoutDismissed` run on every load and
  import path. Deletions and cancellations need tombstones because the source email
  stays in the mailbox and is re-imported on the next scan.

`tripGroupingService.js` then derives trips from bookings: flights define windows,
overlapping windows merge (an unpaired flight would otherwise split one trip into
several), insurance never defines a trip, and undated bookings surface in a separate
"unattached" group instead of being filtered away silently.

### Other domain services

`passengerRightsService` (EU261/UK261 vs Israeli law thresholds — 3h vs 8h),
`flightStatusService`, `airportsData`, `drivingRestrictionsService` (ZTL/LEZ, sticker
requirements), `itineraryConflictService`, `ticketConflictService` (timed tickets vs
the daily plan), `tripCostService`, `routeGeometryService`.

## Conventions

Comments are in Hebrew and explain **why**, usually by naming the failure the code
prevents. This is deliberate: nearly every non-obvious branch encodes a bug that
reached a real user. Match that style — a comment that restates the code adds nothing.

Three failure patterns recur; check for them in any change:

1. **A fix applied to one type but not its siblings.** Signal-based dedupe, deletion
   tombstones and cancellation tombstones were each written for one booking type and
   had to be generalized later, one painful round at a time.
2. **A plausible-looking value taken from the wrong place.** A policyholder's mobile
   shown as the insurer's emergency line; `11-2025` in a product name read as an expiry
   date; model-invented coordinates and website URLs. Prefer an empty field: an empty
   one is corrected by the next document, an invented one is trusted.
3. **A failure reported as success.** Empty `catch {}` blocks and confirmation
   messages not derived from the actual result. Success text must be computed from
   what happened.

Backup files (`*.backup_*`, `*.bak2`, `*_old_backup.js`) sit next to live code in
`src/pages`; they are dead. `src/bookingAPI.js` and
`src/components/route-planner/RoutePlanner.js` contain known dead or broken code.
