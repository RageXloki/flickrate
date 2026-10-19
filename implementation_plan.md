# FlickRate — Master Implementation & Completion Plan

## 1. Project Audit Summary
- **Current Stack**: Django 5 + Django REST Framework + SimpleJWT backend; React 18 + TypeScript + Vite + Tailwind CSS frontend.
- **Backend Test Status**: 55 existing tests passing (auth, movies, reviews, watchlist, recommendations, assistant).
- **Frontend Test Status**: 7 test suites (18 tests) passing; production build (`tsc -b && vite build`) passing with 0 errors.
- **Core Strengths**: Clean modular Django app architecture; explainable TF-IDF/Jaccard recommendation engine; transparent Bayesian FlickRate scoring formula; responsive UI with dark cinematic aesthetics.

## 2. Identified Completion Gaps
1. **Movie Detail Experience**:
   - Tabbed / sectioned navigation: Overview, Cast & Crew, Ratings, Critic Reviews, Audience Reviews, Trailers & Videos, More Like This.
   - Enhanced metadata: Original title, tagline, runtime, certification/rated, spoken languages, country, status, budget, box office, awards, production companies, external links.
   - Cast & crew with character names, profile photos, and clickable person links.
   - Video gallery with official YouTube trailers, teasers, behind-the-scenes clips, embedded player with responsive modal and YouTube fallback.
   - Mark as Watched / Viewing History action alongside Watchlist.
   - Social share modal / copy link action.
   - Content reporting modal for reviews and movies.
2. **Ratings & Scoring**:
   - Multi-source display: IMDb, Rotten Tomatoes, Metacritic, TMDB, and FlickRate community rating.
   - Documented Bayesian formula explanation banner.
   - Interactive 1-10 star rating with distribution breakdown.
3. **Review Platform & Moderation**:
   - Spoiler flag (`is_spoiler`), spoiler warning and tap-to-reveal on frontend.
   - Filter/sort reviews by newest, oldest, highest-rated, lowest-rated, most-helpful.
   - Review reporting endpoint (`/api/reviews/:id/report/`) and admin moderation workflow.
   - Authorized critic reviews display (publication, author, verdict, link).
4. **Catalogue & Discovery**:
   - Dedicated Indian Regional Cinema discovery page (`/regional`) covering Tamil, Telugu, Malayalam, Kannada, Bengali, Marathi films.
   - Dedicated Top-Rated Movies page (`/top-rated`).
   - Dedicated Upcoming & New Releases page (`/upcoming`).
   - Dedicated Search Results page (`/search?q=...`) with multi-facet filters (year, genre, industry, rating).
   - Dedicated Person / Filmography detail page (`/people/:id`) displaying biography, filmography credits, and role details.
5. **User Accounts, Profiles & Custom Lists**:
   - Watched movies / viewing history tracking (marked as watched, watched date).
   - Custom Movie Lists model & API (`/api/lists/`): title, description, is_private, movies list, CRUD actions.
   - Custom Lists frontend pages (`/lists`, `/lists/:id`, create list modal).
   - Profile tabs: Watchlist, Watched History, My Ratings & Reviews, My Custom Lists, Account Settings (bio, avatar, favorite genres).
   - Account deletion & privacy endpoint (`DELETE /api/auth/me/`).
6. **Data Ingestion & Synchronization**:
   - Enriched TMDB ingestion extracting trailers, teasers, clips, cast photos, characters, budget, revenue, certification, awards.
   - OMDb enrichment extracting Metacritic score, awards, box office, rated certification.
   - Enhanced mock/seeded datasets for Hollywood, Bollywood, and Regional cinema for robust out-of-the-box operation even without live external keys.
7. **Verification & Testing**:
   - Complete backend tests for all new models and views (watched history, custom lists, review reporting, person endpoints).
   - Complete frontend tests for all new pages and components.
   - Production build verification and runtime integration tests.

## 3. Implementation Checklist
- [x] Initial codebase audit and test suite verification
- [x] Backend: Add `WatchedMovie` and `CustomList` / `CustomListItem` models in `watchlist` / `lists` apps
- [x] Backend: Add `is_spoiler` and `ReviewReport` models in `reviews` app
- [x] Backend: Enhance `Movie` model with budget, revenue, awards, certification, Metacritic score, cast details (with characters and photos), and video clips
- [x] Backend: Update `ingest.py` and `omdb.py` to extract Metacritic, awards, box office, and video clips
- [x] Backend: Add Person / Filmography discovery endpoint (`/api/movies/person/<name>/`) and Regional Cinema endpoint (`/api/movies/regional/`)
- [x] Backend: Run migrations and verify migration integrity (`movies.0002`, `reviews.0002`, `watchlist.0002`)
- [x] Backend: Implement APIs for Watched History, Custom Lists, Review Reporting, Search, Top Rated, Upcoming, Regional cinema
- [x] Backend: Write comprehensive unit and integration tests for new endpoints (61 passing tests)
- [x] Frontend: Build dedicated Search Results page (`/search`) with real-time multi-facet filters & voice search
- [x] Frontend: Build dedicated Top-Rated page (`/top-rated`) and Upcoming page (`/upcoming`)
- [x] Frontend: Build dedicated Indian Regional Cinema page (`/regional`)
- [x] Frontend: Build dedicated Person / Filmography page (`/people/:name`)
- [x] Frontend: Build dedicated Custom Lists page (`/lists`) and list detail page (`/lists/:id`)
- [x] Frontend: Enhance Movie Detail Page with tabs (Overview, Cast & Crew, Ratings, Critic Reviews, Audience Reviews, Trailers & Videos, More Like This), spoiler blur, mark as watched, share modal, and report modal
- [x] Frontend: Enhance Profile page with Watched History, Custom Lists, Reviews & Ratings, and Account Settings
- [x] Frontend: Update Navbar and routing in `App.tsx`
- [x] Frontend: Write and run frontend tests for new components and pages (10 test files, 21 tests passing)
- [x] Frontend: Run production build `npm run build` (tsc & vite build 0 errors)
- [x] Integration: Run full end-to-end checks across backend and frontend
- [x] Final Completion Report
