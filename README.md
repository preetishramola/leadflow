# LeadFlow

A small, single-screen lead tracker for sales reps. You can keep a list of leads, record every conversation with them, and set follow-up reminders that are pinned to the top of the list on the day they're due.

**Stack:** Next.js 15 (App Router, TypeScript, Tailwind CSS v4, TanStack Query, Radix UI) · FastAPI · SQLAlchemy 2 · SQLite locally, Postgres in Docker.

---

## Features

**Lead list**
- Each row shows the name, company, status badge, last discussion note, time since that discussion and the next follow-up.
- **Overdue** and **Due today** follow-ups are pinned above everything else. Overdue rows are highlighted in red. A follow-up that is due today but whose time has already passed is shown in red as well.
- You can filter by status (the counts are shown on each filter) and search by name (debounced, with `/` to focus the search box).

**Lead timeline (dialog)**
- Opens in place when you click a lead. It shows the full discussion history newest first, grouped by day.
- Add a note with an optional follow-up. You can use quick picks (*Later today*, *Tomorrow 10am*, *In 3 days*, *Next Monday*) or set any date and time. `⌘/Ctrl + Enter` saves.
- Saving with a follow-up updates the lead's follow-up, and the list re-sorts and re-pins immediately.
- The status can be changed from the dialog header. **Mark done** clears a follow-up once it has been handled.

**Add lead:** name is required, company and phone are optional, and status defaults to *New*. After you save, the new lead's timeline opens so you can log the first conversation right away. Press `N` to open this form from anywhere.

---

## Running it

### Option A: Docker (one command)

```bash
cp .env.example .env        # optional, only needed to change ports or credentials
docker compose up --build
```

- Web: http://localhost:3000
- API: http://localhost:8000 (interactive docs at `/docs`)

Postgres runs in its own container. The API seeds 7 sample leads on first start.

If port 3000 or 8000 is already in use, start it with other ports instead: `API_PORT=8010 WEB_PORT=3010 docker compose up --build`.

### Option B: Run locally

You need Python 3.12+ and Node 20+.

**Backend**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env          # defaults to SQLite, nothing else to set up
python -m app.seed            # 7 sample leads with discussions
uvicorn app.main:app --reload --port 8000
```

**Frontend** (in a second terminal)

```bash
cd frontend
npm install
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open http://localhost:3000.

To reset the sample data, run `python -m app.seed --reset`.

### Tests

```bash
cd backend && pytest
```

There are 23 API tests. They cover status codes, validation, filtering and search, discussion ordering, list ordering, and the rules for updating follow-ups.

---

## Environment variables

| Variable | Where | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | backend | `sqlite:///<backend>/leadflow.db` | SQLAlchemy URL. Use `postgresql+psycopg://…` for Postgres. |
| `CORS_ORIGINS` | backend | `http://localhost:3000` | Comma-separated origins that are allowed to call the API |
| `NEXT_PUBLIC_API_URL` | frontend | `http://localhost:8000` | Where the browser sends API requests |
| `API_PORT`, `WEB_PORT` | compose | `8000`, `3000` | Host ports |
| `POSTGRES_USER/PASSWORD/DB` | compose | `leadflow` | Credentials for the local Postgres container |

Each of `.env.example`, `backend/.env.example` and `frontend/.env.example` lists the variables used in that context.

---

## API

| Method | Path | Success | Errors |
|---|---|---|---|
| `GET` | `/api/leads?status=&search=` | `200` list with `last_note` and `last_discussion_at` | `422` unknown status |
| `GET` | `/api/leads/counts` | `200` `{ total, by_status }` | |
| `POST` | `/api/leads` | `201` created lead | `422` missing name or invalid phone |
| `GET` | `/api/leads/{id}` | `200` | `404` |
| `PATCH` | `/api/leads/{id}` | `200` updated lead (only the fields you send) | `400` empty body · `404` · `422` |
| `GET` | `/api/leads/{id}/discussions` | `200` newest first | `404` |
| `POST` | `/api/leads/{id}/discussions` | `201` | `404` · `422` empty note, or follow-up in the past or without a timezone |

Every error response has a `detail` message. Validation errors also include `errors: { field: message }`, so the UI can show the message next to the input that caused it.

---

## Design decisions

- **"Today" is worked out in the browser.** Timestamps are stored in UTC, and the frontend splits leads into Overdue, Due today and the rest using the viewer's local calendar. If the server decided what counts as today, it would use the server's timezone, and pinning would be wrong for anyone in a different timezone.
- **Follow-ups need a timezone.** The API rejects naive datetimes. A small `UTCDateTime` column type stores UTC and always returns timezone-aware values, so SQLite and Postgres behave the same.
- **A discussion and its follow-up are saved in one transaction**, so the list can never show a new note without the matching follow-up.
- **Logging a note without a follow-up leaves the existing follow-up unchanged.** Follow-ups are cleared on purpose with *Mark done*, so a quick note can't accidentally wipe a reminder.
- **"Last note" and "time ago" are not stored on the lead.** They come from correlated subqueries on the newest discussion, so the values can't drift out of sync.
- **Instant updates:** every write invalidates the cached lead queries in React Query, so the list, counts and dialog all refetch right away.
- **Out of scope for this exercise:** authentication (listed as optional) and Alembic migrations. Tables are created on startup. A real deployment would use migrations.

---

## Project structure

```
backend/
  app/
    main.py          FastAPI app, CORS, error handlers
    routers/leads.py HTTP layer only: status codes, 404s
    crud.py          all database queries
    models.py        SQLAlchemy models + UTCDateTime
    schemas.py       Pydantic request/response models and validation
    seed.py          sample data
  tests/             pytest suite
frontend/src/
  app/               layout, providers, page
  components/ui/     Button, Dialog, TextField, Kbd
  components/leads/  LeadsScreen, LeadList, LeadRow, LeadTimelineDialog, DiscussionForm, ...
  hooks/             React Query hooks, useNow, useDebouncedValue
  lib/               API client, types, date helpers, status styles
```

---

## Use of AI

This project was built with Claude Code, an AI coding assistant, which wrote most of the code, tests and this README from my requirements. Commits it co-wrote carry a `Co-Authored-By` trailer.

<!-- TODO (Preetish): before submitting, replace this with an accurate description of your own part: what you reviewed, changed or decided yourself. -->

