# Tasks: Modern Forex Lot Size Calculator with Optional Save Functionality

**Input**: Design documents from `/specs/001-modern-and-super/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Phase 3.1: Project Setup

- [x] T001 Create Next.js 15 project structure with TypeScript and App Router
- [x] T002 Install and configure dependencies: Next.js, Prisma, NextAuth.js, Tailwind CSS, Zod, decimal.js
- [x] T003: Configure ESLint, Prettier, and TypeScript strict mode ✅ COMPLETED
- [x] T004 [P] Setup Tailwind CSS configuration with responsive breakpoints and forex calculator styling
- [ ] T005 Setup PostgreSQL database with Docker Compose for development
- [ ] T006 Initialize Prisma ORM with PostgreSQL connection

## Phase 3.2: Database Models & Schema (TDD Foundation)

- [ ] T007 [P] Create Prisma schema for User model in `prisma/schema.prisma`
- [ ] T008 [P] Create Prisma schema for Calculation model in `prisma/schema.prisma`
- [ ] T009 [P] Create Prisma schema for CurrencyPair model in `prisma/schema.prisma`
- [ ] T010 [P] Create Prisma schema for ExchangeRate model in `prisma/schema.prisma`
- [ ] T011 Create database migration and seed file with major currency pairs
- [ ] T012 [P] Create Zod validation schemas in `app/lib/validations.ts`

## Phase 3.3: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.4

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (API Endpoints)

- [ ] T013 [P] Contract test POST /api/calculations in `tests/contract/test-calculations-post.test.ts`
- [ ] T014 [P] Contract test GET /api/calculations in `tests/contract/test-calculations-get.test.ts`
- [ ] T015 [P] Contract test POST /api/calculations/save in `tests/contract/test-calculations-save.test.ts`
- [ ] T016 [P] Contract test DELETE /api/calculations/[id] in `tests/contract/test-calculations-delete.test.ts`
- [ ] T017 [P] Contract test GET /api/rates/[pair] in `tests/contract/test-rates-get.test.ts`
- [ ] T018 [P] Contract test POST /api/auth/register in `tests/contract/test-auth-register.test.ts`
- [ ] T019 [P] Contract test POST /api/auth/login in `tests/contract/test-auth-login.test.ts`

### Integration Tests (User Scenarios)

- [ ] T020 [P] Integration test: Anonymous lot size calculation in `tests/integration/test-anonymous-calculation.test.ts`
- [ ] T021 [P] Integration test: User registration and login flow in `tests/integration/test-user-auth.test.ts`
- [ ] T022 [P] Integration test: Save and manage calculations in `tests/integration/test-save-calculations.test.ts`
- [ ] T023 [P] Integration test: Mobile responsive experience in `tests/integration/test-mobile-responsive.test.ts`
- [ ] T024 [P] Integration test: Error handling and edge cases in `tests/integration/test-error-handling.test.ts`

## Phase 3.4: Core Implementation (ONLY after tests are failing)

### Database & Utilities Layer

- [ ] T025 [P] Prisma client configuration in `app/lib/db.ts`
- [ ] T026 [P] Forex calculation logic with decimal.js in `app/lib/forex.ts`
- [ ] T027 [P] NextAuth.js configuration in `app/lib/auth.ts`
- [ ] T028 [P] External forex API service in `app/lib/forex-api.ts`

### API Routes Implementation

- [ ] T029 POST /api/calculations endpoint in `app/api/calculations/route.ts`
- [ ] T030 GET /api/calculations endpoint in `app/api/calculations/route.ts`
- [ ] T031 POST /api/calculations/save endpoint in `app/api/calculations/save/route.ts`
- [ ] T032 DELETE /api/calculations/[id] endpoint in `app/api/calculations/[id]/route.ts`
- [ ] T033 GET /api/rates/[pair] endpoint in `app/api/rates/[pair]/route.ts`
- [ ] T034 POST /api/auth/register endpoint in `app/api/auth/register/route.ts`
- [ ] T035 POST /api/auth/login endpoint in `app/api/auth/login/route.ts`

### React Components

- [ ] T036 [P] Calculator form component in `app/components/CalculatorForm.tsx`
- [ ] T037 [P] Calculation results component in `app/components/CalculationResults.tsx`
- [ ] T038 [P] User authentication components in `app/components/AuthComponents.tsx`
- [ ] T039 [P] Calculation history component in `app/components/CalculationHistory.tsx`

### Pages and Layout

- [ ] T040 Main calculator page in `app/calculator/page.tsx`
- [ ] T041 User dashboard page in `app/dashboard/page.tsx`
- [ ] T042 Authentication pages in `app/(auth)/login/page.tsx` and `app/(auth)/register/page.tsx`

## Phase 3.5: Integration & Polish

- [ ] T043 [P] Input validation middleware for API routes
- [ ] T044 [P] Error handling and logging middleware
- [ ] T045 [P] Rate limiting implementation for API protection
- [ ] T046 [P] SEO optimization: meta tags, sitemap, and JSON-LD schema
- [ ] T047 [P] Performance optimization: Core Web Vitals compliance
- [ ] T048 [P] Unit tests for forex calculation logic in `tests/unit/test-forex-calculations.test.ts`
- [ ] T049 Run Playwright E2E tests covering quickstart scenarios
- [ ] T050 Performance testing: verify <2s page load and <500ms calculations
- [ ] T051 [P] Documentation: API documentation and deployment guide
- [ ] T052 Final integration test: execute complete quickstart.md validation

## Dependencies

- Setup (T001-T012) before all other phases
- Tests (T013-T024) before implementation (T025-T048)
- Database models (T007-T012) before API implementation (T029-T035)
- Utility layer (T025-T028) before API routes (T029-T035)
- API routes (T029-T035) before UI components (T036-T042)
- Components (T036-T039) before pages (T040-T042)
- Core implementation before polish (T043-T052)

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- Verify all contract and integration tests fail before implementing
- Run `npm test` after each implementation task to ensure tests pass
- Commit after each completed task for granular progress tracking
- Constitutional compliance validated throughout implementation
