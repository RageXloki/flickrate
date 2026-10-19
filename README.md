# FlickRate — AI-Powered Movie Discovery & Recommendation Platform

> **Discover. Rate. Watch.**
> Intelligent cinematic discovery platform bridging Hollywood and Indian cinema (Bollywood, Tollywood, Kollywood, Mollywood, Sandalwood) with multi-source ratings, explainable AI recommendations, mood exploration, and conversational search.

---

## 1. Product Architecture & Overview

FlickRate is a modern, full-stack movie discovery web application designed to eliminate endless scrolling. Built with a cinematic dark aesthetic, it aggregates real critic scores and community insights, supports official YouTube trailers, and delivers transparent, content-based AI recommendations.

```text
                               +----------------------------------------+
                               |     React 18 + TypeScript Frontend     |
                               |  (Vite, Tailwind, Lucide, Web Speech)  |
                               +-------------------+--------------------+
                                                   | HTTP (Axios / JWT)
                                                   v
                               +----------------------------------------+
                               |       Django REST Framework Backend     |
                               |  - Auth & Profile Service (SimpleJWT)  |
                               |  - Catalog & Search Engine             |
                               |  - Bayesian Rating Aggregation Engine  |
                               |  - TF-IDF & Cosine Similarity Engine   |
                               |  - AI Assistant (Anthropic / NLP)      |
                               |  - Staff Telemetry & Moderation Console|
                               +-------------------+--------------------+
                                                   |
                         +-------------------------+-------------------------+
                         |                                                   |
                         v                                                   v
           +---------------------------+                       +---------------------------+
           |   PostgreSQL / SQLite     |                       |    Live External APIs     |
           |  - 27 Verified Baseline   |                       |  - TMDB API (Metadata)    |
           |  - User Profiles & JWT    |                       |  - OMDb API (IMDb / RT)   |
           |  - Watchlists & Reviews   |                       |  - Anthropic API (Claude) |
           |  - Search History Logs    |                       |  - YouTube Official embeds|
           +---------------------------+                       +---------------------------+
```

---

## 2. Core Capabilities

### Dual Cinema Focus (Hollywood & Indian Cinema)
- **Universal Catalog**: Seamlessly discovers both Hollywood blockbusters and Indian cinema across Hindi (Bollywood), Telugu (Tollywood), Tamil (Kollywood), Malayalam (Mollywood), and Kannada (Sandalwood).
- **Dedicated Hubs**:
  - `/hollywood`: Curated trending rail, all-time classics, director & actor spotlight cards (Nolan, DiCaprio, Villeneuve).
  - `/bollywood`: Dedicated rails for Bollywood Trending, Top Rated, Regional Indian Cinema, Classics, and cinematic legends (Shah Rukh Khan, Rajkumar Hirani, Aamir Khan).
- **Authentic Baseline Catalog**: Ships out-of-the-box with **27 authentic, verified movies** (*Interstellar*, *Inception*, *The Dark Knight*, *Oppenheimer*, *Dune: Part Two*, *3 Idiots*, *Dangal*, *Lagaan*, *PK*, *Zindagi Na Milegi Dobara*, *RRR*, *KGF: Chapter 2*, *Kantara*, *Tumbbad*, etc.). **Zero fabricated mock data.**

### Transparent Multi-Source Ratings & Bayesian Score
- Displays **IMDb** (1-10 with vote count) and **Rotten Tomatoes** (Tomatometer % score) side-by-side.
- **FlickRate Score Formula**:
  $$\text{FlickRate Score} = w_1 \cdot \text{IMDb} + w_2 \cdot \left(\frac{\text{RT}}{10}\right) + w_3 \cdot \text{UserRating} + w_4 \cdot \text{PopularityPrior}$$
  - Dynamically normalizes missing ratings without ever inventing fake numbers.
  - Interactive 1–10 star rating widget on every movie detail page with instant re-calculation.
  - **10-Star Rating Distribution**: Visual breakdown histogram showcasing community score spread.

### Explainable AI Recommendations
- Powered by `scikit-learn` with TF-IDF vectorization and cosine similarity over plot overviews, keywords, genres, and cast.
- Director matching and Jaccard genre similarity bonuses.
- Transparent explanations: Every recommendation surfaces **why** it was suggested (e.g. *"Directed by Christopher Nolan"*, *"Shared genres: Sci-Fi, Adventure"*, *"High critic consensus"*).
- Personalized recommendation feed built from user watchlists and ratings ≥ 7/10.

### AI Mood Discovery Engine (`/moods`)
- 10 emotional vibe profiles: **Happy**, **Sad**, **Romantic**, **Exciting**, **Scary**, **Relaxing**, **Inspirational**, **Mind-bending**, **Emotional**, and **Funny**.
- Atmospheric gradients, custom iconography, tone explanations, and dynamically curated recommendations.

### Natural Language & Voice Search
- **AI Movie Assistant (`/assistant`)**: Natural language search powered by Anthropic API (when configured) or an advanced deterministic NLP regex parser (handles runtime *"less than 2 hours"*, temporal filters *"after 2018"*, industry *"Hindi comedy"*, actors, and movie similarity *"like Shutter Island"*).
- **Voice Search**: Real-time microphone dictation via the browser Web Speech API.

### Admin & Telemetry Console (`/admin-dashboard`)
- Real-time KPI telemetry (total users, catalog movies, published reviews, submitted ratings, watchlists).
- Live TMDB ingest tool: Enter any valid TMDB ID to sync metadata directly into the database.
- Most viewed & most rated leaderboards.
- Genre and industry distribution visualizers.
- Review moderation dashboard with one-click deletion.
- User account roster.

---

## 3. Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, React Router v6, Axios, Lucide React, Vitest.
- **Backend**: Python 3.13 / 3.12, Django 5.1, Django REST Framework, SimpleJWT, scikit-learn, NumPy.
- **Database**: PostgreSQL (production / Docker) or SQLite (zero-config local dev).
- **External Integrations**: TMDB API, OMDb API, Anthropic Claude API (optional), YouTube.

---

## 4. Quick Start (Local Setup)

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+ (Python 3.11–3.13 supported)

### 1. Clone & Configure Backend
```bash
git clone https://github.com/your-username/flickrate.git
cd flickrate/backend

# Create virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed catalog (27 verified authentic movies)
python manage.py seed_movies

# (Optional) Seed live data from TMDB if you have an API key:
# Set TMDB_API_KEY and OMDB_API_KEY in backend/.env then re-run seed_movies

# Create admin user
python manage.py createsuperuser

# Start Django dev server
python manage.py runserver
```
Backend API will be running at `http://localhost:8000/`.

### 2. Configure & Start Frontend
```bash
cd ../frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Open `http://localhost:5173/` in your browser.

---

## 5. Docker Deployment

Deploy the entire full-stack platform (PostgreSQL, Django backend, Nginx frontend) with a single command:

```bash
docker compose up --build -d
```

Seed the catalog inside the container:
```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_movies
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000/api/`
- **Django Admin**: `http://localhost:8000/admin/`

---

## 6. Environment Variables

### Backend (`backend/.env`)
```ini
DJANGO_SECRET_KEY=your-secure-random-key
DJANGO_DEBUG=True
DB_ENGINE=sqlite                    # Or postgres
# DB_NAME=flickrate
# DB_USER=postgres
# DB_PASSWORD=postgres
# DB_HOST=localhost
# DB_PORT=5432
TMDB_API_KEY=                      # Free at https://www.themoviedb.org/settings/api
OMDB_API_KEY=                      # Free at https://www.omdbapi.com/apikey.aspx
ANTHROPIC_API_KEY=                 # Optional: enables LLM conversational assistant
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```ini
VITE_API_BASE_URL=                 # Left blank in dev; Vite proxies /api to http://localhost:8000
```

---

## 7. Verification & Test Suite

### Backend Test Suite (55 Tests)
```bash
cd backend
.\venv\Scripts\python.exe manage.py test
```
Result: **55 of 55 tests passing** covering authentication, permissions, ratings, reviews, watchlist, recommendation engine, mood engine, search history, and admin telemetry.

### Frontend Test Suite (18 Tests)
```bash
cd frontend
npx vitest run
```
Result: **18 of 18 tests passing** covering components, formatting utilities, Bollywood page, Hollywood page, Moods page, and Admin Dashboard.

### Frontend Production Build
```bash
cd frontend
npm run build
```
Result: **Production bundle compiled cleanly** (`dist/assets/index.js`, `dist/assets/index.css`).

---

## 8. REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/register/` | `POST` | Create a new user account |
| `/api/auth/login/` | `POST` | Authenticate and obtain JWT access & refresh tokens |
| `/api/auth/me/` | `GET, PATCH` | Fetch or update user profile and language preferences |
| `/api/movies/` | `GET` | List movies with filters (`genre`, `industry`, `language`, `year_min`, `min_rating`, `sort`, `page`) |
| `/api/movies/:id/` | `GET` | Retrieve complete movie detail, multi-source ratings, distribution breakdown |
| `/api/movies/:id/rate/` | `POST` | Submit direct 1–10 star rating; recomputes FlickRate score |
| `/api/movies/:id/trailer/` | `GET` | Get official YouTube trailer embed URL |
| `/api/movies/bollywood/` | `GET` | Dedicated Bollywood rails, regional cinema, and artist spotlights |
| `/api/movies/hollywood/` | `GET` | Dedicated Hollywood trending, top-rated, and artist spotlights |
| `/api/movies/top-rated/` | `GET` | Movies ranked by normalized FlickRate score |
| `/api/movies/new-releases/` | `GET` | Recent releases ordered by release date |
| `/api/movies/search/?q=...` | `GET` | Autocomplete search across title, cast, director, and keywords |
| `/api/recommendations/?movie_id=...` | `GET` | Content-based explainable recommendations |
| `/api/recommendations/personalized/` | `GET` | User-personalized recommendation feed |
| `/api/recommendations/mood/?mood=...` | `GET` | Vibe recommendations across 10 emotional moods |
| `/api/assistant/` | `POST` | Natural language conversational search |
| `/api/watchlist/` | `GET` | Retrieve logged-in user's watchlist |
| `/api/watchlist/:movie_id/` | `POST, DELETE` | Add/remove movie from user watchlist |
| `/api/movies/admin/stats/` | `GET` | Platform telemetry and analytics (staff only) |
| `/api/movies/admin/users/` | `GET` | User management roster (staff only) |
| `/api/movies/admin/reviews/` | `GET` | Review moderation feed (staff only) |
| `/api/movies/admin/reviews/:id/` | `DELETE` | Delete review from platform (staff only) |
| `/api/movies/admin/sync/` | `POST` | Ingest and sync movie by TMDB ID (staff only) |

---

## 9. Default Demo Accounts

The local database comes pre-seeded with two authentic accounts:

| Role | Username | Email | Password |
|---|---|---|---|
| **Administrator (Staff)** | `admin` | `admin@flickrate.dev` | `admin12345` |
| **Standard User** | `demouser` | `demo@flickrate.dev` | `demo12345` |

---

## 10. License

Released under the [MIT License](LICENSE).
