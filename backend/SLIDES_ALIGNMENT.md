# Slides-to-Code Alignment

This file maps the software engineering slide topics to the rewritten backend.

## NodeJS + modular code

From:
- `Introduction to NodeJS.pdf`
- `NodeJS, APIs, Deploying to Firebase.pdf`

Applied as:
- Modular folders (`routes`, `services`, `middleware`, `data`, `config`)
- Async/await usage across all request handlers and data access
- REST endpoints with explicit HTTP verbs and JSON responses

## Firestore + JSON documents

From:
- `Week 17 - Introduction to Firestore, Creating our first database.pdf`

Applied as:
- Firestore collection/document access pattern in `src/data/store.js`
- JSON-shaped documents with flexible fields
- Shared repository abstraction to support both Firestore and memory-mode

## Authentication and secure APIs

From:
- `Week 20 - Firebase Authentication.pdf`

Applied as:
- Firebase ID token verification (`Authorization: Bearer ...`)
- Development auth fallback for local testing
- Secure endpoint (`GET /api/secure/ping`) for protected client sections

## Data ownership

From:
- `Week 21 - Data Ownership.pdf`

Applied as:
- User-owned records include `uid` and `ownerUid`
- All CRUD queries are scoped by authenticated user ID
- Friend request acceptance validates recipient ownership

## Testing and automation

From:
- `Week 21 - Software Testing Theory.pdf`
- `Week 21 - Software Testing Practical.pdf`

Applied as:
- Automated integration tests with Mocha + Chai + Supertest
- Baseline tests for health, auth protection, and user/dashboard flow
- Added `npm test` script for repeatable checks
