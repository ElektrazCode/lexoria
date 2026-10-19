# Gates of Lexoria

**Gates of Lexoria** is a fantasy-inspired vocabulary-learning application that turns language practice into a journey through a library of words. The project currently uses **Modern Greek** vocabulary, with a language-neutral data model intended to support additional languages in the future.

The application is a working **MVP (minimum viable product)**. Its focus is a clear learning flow: browse vocabulary, practise with flashcards, and see an honest overview of the data currently stored. The experience is designed around the idea of exploring a magical world of language, with areas such as the Great Hall and Memory Scrolls.

## Features

| Area | Status | What it does |
| --- | --- | --- |
| **The Great Hall** | Implemented | Dashboard showing the number of vocabulary words and groups, recorded study sessions, and the most recent session when one exists. |
| **The Lexicon** | Implemented | Browse Greek vocabulary with English translations and parts of speech; search in Greek or English, including accent-insensitive Greek search. |
| **Memory Scrolls** | Implemented | Interactive flashcards with Greek-to-English and English-to-Greek practice, card flipping, known/missed marking, progress tracking, and review rounds for missed words. |
| **Trial of Wits** | Coming soon | An additional vocabulary-learning activity. |
| **The Matching Hall** | Coming soon | A matching-based vocabulary activity. |
| **Scribe's Table** | Coming soon | A writing-focused practice activity. |

**Current limitation:** Memory Scrolls tracks answers within the current browser session only. Flashcard results are **not yet saved** to the backend, so they do not increase the study-session statistics on the Great Hall. A page reload resets the practice round.

## Technology

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router
- **Backend:** Go, Gin, SQLite
- **Testing:** Vitest and Testing Library for the frontend; Go tests for the backend; separate integration tests against a running API

## Project structure

The GitHub repository is named **Lexoria**, while the application itself is called **Gates of Lexoria**. The existing directory names are intentionally retained.

```text
lexoria/
└── lang-portal/
    ├── frontend_react/   # React application
    ├── backend_go/       # Go API and SQLite setup
    └── Documentation/    # Project notes and technical specifications
```

## Running locally

Requirements: **Go**, **Node.js 22.12+**, and **npm**. The backend is intended for local development and listens on `127.0.0.1:8080` by default.

From the repository root, use two terminals:

**Terminal 1 — Backend**

```bash
cd lang-portal/backend_go
go run github.com/magefile/mage init
go run github.com/magefile/mage seed
go run .
```

**Terminal 2 — Frontend**

```bash
cd lang-portal/frontend_react
npm ci
npm run dev
```

Open the local URL displayed by Vite (typically `http://localhost:5173`). The frontend development server proxies `/api` requests to the Go backend. Seeding is designed to be repeatable.

For more backend details, see [`lang-portal/backend_go/Readme.md`](lang-portal/backend_go/Readme.md).

## Future considerations

These are planned improvements and areas for exploration, **not implemented features**:

- **Learning progress:** Save practice sessions and word-level results; track progress over time and distinguish studied words from mastered words.
- **More learning activities:** Build the Trial of Wits, Matching Hall, and Scribe's Table.
- **Additional languages:** Add language selection and multilingual vocabulary collections beyond the initial Greek dataset.
- **Vocabulary management:** Support importing, organizing, and expanding word collections, with pagination as the dataset grows.
- **Backend robustness:** Improve validation and HTTP error responses, avoid exposing internal database errors, and enforce appropriate database constraints.
- **Deployment and accounts:** Design authentication, authorization, and secure write operations before any public deployment. The current backend is configured for **local use**, not as a public multi-user service.
- **Accessibility and UX:** Continue keyboard and screen-reader testing, refine the visual experience, and consider a mobile app in the future (using **Lexoria** as its short label).
- **Project maintenance:** Refresh older technical documentation, add continuous integration, and keep dependencies up to date.

## Project status

The functional MVP is implemented and tested. Visual design refinement, additional learning activities, and persistent learning progress are future work.
