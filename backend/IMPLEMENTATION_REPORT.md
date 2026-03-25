# Budg'Ball Backend Implementation Report

## 1) Approaches considered before coding (rewrite pass)

### A. Data layer strategy

**Option 1: Firebase-only backend**
- Pros: clean production path, fewer branches in code.
- Cons: blocks local development without service credentials.

**Option 2: Memory-only backend**
- Pros: easiest setup for demos.
- Cons: no production persistence, no Firebase integration.

**Chosen:** Hybrid strategy (Firebase + memory fallback in same API).
- Reason: supports course demos and team development quickly, while preserving production-ready Firebase paths.

### B. API style for React client compatibility

**Option 1: GraphQL**
- Pros: flexible frontend data fetching.
- Cons: higher initial complexity for this scope.

**Option 2: REST**
- Pros: straightforward, easier to test/debug, maps directly to user stories.

**Chosen:** REST.

### C. Function style and endpoint strategy

**Option 1: Callable-only Firebase functions (`onCall`)**
- Pros: direct parity with the slides and strong auth context support.
- Cons: tighter coupling to Firebase Functions runtime for every endpoint.

**Option 2: Express REST API with Firebase token verification**
- Pros: still follows slide principles (HTTP APIs, JSON, token auth) while remaining easy to use from React `fetch`/Axios.
- Cons: requires explicit auth middleware and response contracts.

**Chosen:** Express REST with Firebase token verification, plus a secure endpoint (`/api/secure/ping`) mirroring the slides' secure function concept.

### D. Authentication strategy

**Option 1: Custom JWT auth service**
- Pros: full control.
- Cons: duplicates Firebase Auth capabilities.

**Option 2: Firebase ID token verification**
- Pros: aligns with React Firebase frontend and secure identity flow.

**Chosen:** Firebase verification, with development override header for local testing.

## 2) Bugs/issues found during implementation and fixes

### Issue 1: Toolchain unavailable in current environment
- **Symptom:** `npm` and `node` commands are not recognized.
- **Impact:** Could not run install/start/smoke tests directly here.
- **Fix applied in project:** Added complete setup docs (`README.md`) plus `.env.example` and memory mode for zero-credential startup once Node is installed.
- **Follow-up required by team:** install Node.js 20+ locally and run `npm install`.

### Issue 2: Potential Firebase credential hard failure
- **Symptom risk:** backend could crash at startup if Firebase env vars are missing.
- **Fix applied:** Added strict env validation in `src/config/env.js` only when `USE_MEMORY_DB=false`, and allowed memory mode default.

### Issue 3: Friend request self-add edge case
- **Symptom risk:** users could send friend requests to themselves.
- **Fix applied:** Added explicit check in `src/routes/friends.js` returning `400`.

### Issue 4: Budget warning threshold not visible after expense writes
- **Symptom risk:** user would log expense but not receive the 80% warning needed by SRS.
- **Fix applied:** Implemented warning logic in `src/routes/expenses.js` based on category budget ratio after write.

### Issue 5: Ballimal progression not synced with spending changes
- **Symptom risk:** expenses affect budgets but not pet state.
- **Fix applied:** Added monthly summary recalculation + user ballimal update in `src/routes/expenses.js` and summary builder in `src/data/store.js`.

### Issue 6: Inconsistent JSON response shapes across endpoints
- **Symptom:** some endpoints returned raw objects while others returned wrapped payloads.
- **Impact:** React components needed endpoint-specific parsing logic.
- **Fix applied:** Introduced unified response envelope via `src/utils/http.js` and updated routes/middleware.

### Issue 7: Route handlers carried too much business logic
- **Symptom:** route files were growing and mixed transport + domain logic.
- **Impact:** harder testing and lower maintainability.
- **Fix applied:** moved core logic into service modules:
  - `src/services/userService.js`
  - `src/services/goalService.js`
  - `src/services/budgetService.js`
  - `src/services/expenseService.js`
  - `src/services/friendService.js`
  - `src/services/dashboardService.js`

### Issue 8: Missing automated integration test baseline
- **Symptom:** only manual verification path existed.
- **Impact:** regressions likely during team changes.
- **Fix applied:** added Mocha/Chai/Supertest test setup and initial integration suite in `test/api.test.js`.

### Issue 9: Data ownership clarity
- **Symptom risk:** ownership fields not explicit enough for future Firestore rules.
- **Fix applied:** ensured user-owned entities include `ownerUid` alongside `uid` in data writes.

## 3) Requirements coverage (user stories)

- **1.1 / 2.1 goals:** create/list/update/complete goal endpoints with reward coins.
- **3.1 edit monthly goal:** `PATCH /api/goals/:goalId` updates target/progress/status.
- **4.1 friends:** search, send request, accept request, list friends implemented.
- **5.1 expenses:** amount/category/date/description persisted and listed.
- **6.1 budgets:** per-category monthly limits, remaining budget calculations, 80%+ warnings.
- **Ballimal impact:** goal completion and budget pressure feed mood/health/coins.

## 4) Remaining technical risks

- No automated tests were run in this environment due missing Node.js.
- Firebase query indexes may be needed for some production compound queries.
- Username uniqueness is not fully enforced yet (requires transactional constraint).
- Duplicate friend requests can still occur in race conditions under concurrent writes.

## 5) Recommended next fixes

1. Expand integration tests to cover all core routes and negative paths.
2. Add uniqueness check for usernames at write-time.
3. Add transactional/idempotent deduplication guard for friend requests.
4. Add rate limiting and request logging middleware for production.
