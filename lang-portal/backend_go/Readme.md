# Language Portal – Go Backend

REST API for a vocabulary-learning portal, built with [Gin](https://github.com/gin-gonic/gin) and SQLite. The portal is **Greek-first** but the code is **language-neutral**: a word's learning-language text is stored in a generic `target_word` column (and exposed as `target_word` in the API), next to its `english` translation. Switching the portal to another language only requires new seed data.

## Architecture

```
backend_go/
├── main.go            # Gin server, route registration (port 8080)
├── MageFile.go        # Mage tasks: init, migrate, seed
├── database/
│   └── database.go    # SQLite connection (words.db is generated locally, not tracked in git)
├── handlers/          # HTTP handlers: dashboard, activities, words, groups, sessions
├── models/            # Shared structs (Word, Group, Activity, Session, ...)
├── migrations/        # SQL schema files (0001_init.sql)
├── seeds/             # JSON seed data (Greek vocabulary)
└── tests/apis/        # API tests (run against a throwaway SQLite database)
```

**Database tables:** `words`, `groups`, `words_groups` (word ↔ group), `activities`, `sessions`, `review_words`.

## Prerequisites

- Go 1.24+
- A C compiler (`gcc`), required by the `go-sqlite3` driver (CGO)
- No `sqlite3` command-line tool and no global Mage install are needed

All commands below are run from the `backend_go/` directory; database and seed paths are relative to it.

## Setup

```sh
cd lang-portal/backend_go

# 1. Create database/words.db and apply the schema
go run github.com/magefile/mage init

# 2. Load the Greek starter data
go run github.com/magefile/mage seed
```

(If you have installed Mage globally, `mage init` / `mage seed` work too.)

| Task         | What it does |
|--------------|--------------|
| `mage init`  | Creates `database/words.db` if missing and applies the migrations. This is the default task. |
| `mage migrate` | Applies every `migrations/*.sql` file in name order (`init` runs the same logic). |
| `mage seed`  | Runs `init`, then loads the seed data. |

### Seeding

Seeding is **idempotent and transactional**: it can be run any number of times without creating duplicates, and if any step fails nothing is written. Rows are matched by natural key:

- words by `target_word` + `english`
- groups and activities by `name`
- word ↔ group links by name (`seeds/words_groups.json` refers to words by `target_word` and groups by `group`, never by numeric ID)

The MVP seed contains 12 Greek words in a single group, **Everyday Essentials**, plus three activities. No study sessions or review history are seeded; a new learner starts with none.

Seeding only ever adds rows. It does not update or remove rows that already exist.

### Migrations

`0001_init.sql` uses `CREATE TABLE IF NOT EXISTS`, so running migrations repeatedly is safe. **Applied migrations are not tracked yet**: every run re-executes every file. That is fine for the current single idempotent migration, but before adding a second migration (e.g. an `ALTER TABLE`) a proper version-tracking mechanism (such as a `schema_migrations` table) must be introduced.

### Resetting the database (destructive)

Deleting or recreating `database/words.db` **permanently destroys all data in it**, including study history. Back it up first:

```sh
cp database/words.db database/words.backup.db
rm database/words.db
go run github.com/magefile/mage seed
```

All `database/*.db` files are git-ignored, so they are never committed (and never restored by git).

A database created before the Greek migration may still contain the old `french` column. `init` will not alter an existing table; back it up and recreate it as above.

## Running the server

```sh
go run .
```

The API listens on `http://localhost:8080`. CORS currently allows all origins.

## Testing

```sh
go test ./...
```

The API tests create a throwaway SQLite database in a temporary directory from `migrations/0001_init.sql` and delete it when they finish. They never touch `database/*.db`, so tests are reproducible and safe to run next to a real `words.db`.

## API overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/last_study_session` | Most recent session as `{"session": {...}}`, or `{"session": null}` if there are none yet |
| GET | `/api/dashboard/study_progress` | Total sessions and words |
| GET | `/api/dashboard/quick-stats` | Total words and groups |
| GET | `/api/activities` | List activities |
| GET | `/api/activities/:id` | One activity |
| GET | `/api/activities/:id/sessions` | Sessions for an activity |
| POST | `/api/activities` | Create an activity |
| GET | `/api/words` | List words (`id`, `target_word`, `english`, `parts`) |
| GET | `/api/words/:id` | One word |
| GET | `/api/groups` | List groups |
| GET | `/api/groups/:id` | One group |
| GET | `/api/groups/:id/words` | Words in a group |
| GET | `/api/groups/:id/sessions` | Sessions for a group |
| GET | `/api/sessions` | List sessions |
| GET | `/api/sessions/:id` | One session |
| GET | `/api/sessions/:id/words` | Words reviewed in a session |
| POST | `/api/sessions/:id/words/:word_id/review` | Record a word review |
| POST | `/api/reset_history` | Clear study history (destructive) |
| POST | `/api/full_reset` | Clear all data (destructive) |
