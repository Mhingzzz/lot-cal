# Implementation Plan: Modern Forex Lot Size Calculator with Optional Save Functionality# Implementation Plan: Modern Forex Lot Size Calculator with Optional Save Functionality

**Branch**: `001-modern-and-super` | **Date**: 2025-09-21 | **Spec**: [spec.md](./spec.md)**Branch**: `001-modern-and-super` | **Date**: 2025-09-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-modern-and-super/spec.md`**Input**: Feature specification from `/specs/001-modern-and-super/spec.md`

## Summary## Execution Flow (/plan command scope)

Primary requirement: Modern, user-friendly forex lot size calculator with optional save functionality for registered users. Technical approach: Next.js full-stack application with PostgreSQL database, responsive mobile design, free exchange rate APIs, and constitutional compliance for accuracy, performance, and security.

````

## Technical Context1. Load feature spec from Input path

**Language/Version**: TypeScript 5.x with Next.js 15+ (App Router)     → Feature spec loaded successfully from spec.md

**Primary Dependencies**: Next.js, React 18+, Prisma ORM, NextAuth.js, Tailwind CSS, Zod validation  2. Fill Technical Context (scan for NEEDS CLARIFICATION)

**Storage**: PostgreSQL database for user accounts and saved calculations     → Detected Project Type: Web application (Next.js frontend + backend)

**Testing**: Jest + React Testing Library, Playwright for E2E testing     → Set Structure Decision: Option 2 (Web application structure)

**Target Platform**: Web application (mobile-responsive)  3. Fill the Constitution Check section based on the content of the constitution document.

**Project Type**: Web - Next.js full-stack application (frontend + backend in single codebase)  4. Evaluate Constitution Check section below

**Performance Goals**: <2s page load, <500ms calculations, 99.9% uptime, Core Web Vitals compliance     → No constitutional violations detected

**Constraints**: Free external APIs only, <3 clicks to results, mobile-first responsive design     → Update Progress Tracking: Initial Constitution Check ✓

**Scale/Scope**: Support for major forex pairs (7 currencies), user registration/auth, calculation history5. Execute Phase 0 → research.md

   → All technical choices resolved from user input

## Project Structure6. Execute Phase 1 → contracts, data-model.md, quickstart.md, .github/copilot-instructions.md

7. Re-evaluate Constitution Check section

### Documentation (this feature)   → No new violations after design

```   → Update Progress Tracking: Post-Design Constitution Check ✓

specs/001-modern-and-super/8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)

├── plan.md              # This file (/plan command output)9. STOP - Ready for /tasks command

├── research.md          # Phase 0 output (/plan command)```

├── data-model.md        # Phase 1 output (/plan command)

├── quickstart.md        # Phase 1 output (/plan command)**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:

├── contracts/           # Phase 1 output (/plan command)

└── tasks.md             # Phase 2 output (/tasks command)- Phase 2: /tasks command creates tasks.md

```- Phase 3-4: Implementation execution (manual or via tools)



### Source Code (repository root)## Summary

````

# Next.js full-stack application structurePrimary requirement: Modern, user-friendly forex lot size calculator with optional save functionality for registered users. Technical approach: Next.js full-stack application with PostgreSQL database, responsive mobile design, free exchange rate APIs, and constitutional compliance for accuracy, performance, and security.

app/ # Next.js 15 App Router

├── (auth)/ # Auth route group## Technical Context

│ ├── login/

│ └── register/**Language/Version**: TypeScript 5.x with Next.js 15+ (App Router)

├── api/ # API routes**Primary Dependencies**: Next.js, React 18+, Prisma ORM, NextAuth.js, Tailwind CSS, Zod validation

│ ├── auth/**Storage**: PostgreSQL database for user accounts and saved calculations

│ ├── calculations/**Testing**: Jest + React Testing Library, Playwright for E2E testing

│ └── rates/**Target Platform**: Web application (mobile-responsive)

├── calculator/ # Main calculator page**Project Type**: Web - Next.js full-stack application (frontend + backend in single codebase)

├── dashboard/ # User dashboard**Performance Goals**: <2s page load, <500ms calculations, 99.9% uptime, Core Web Vitals compliance

├── components/ # Shared React components**Constraints**: Free external APIs only, <3 clicks to results, mobile-first responsive design

├── lib/ # Utilities and configurations**Scale/Scope**: Support for major forex pairs (7 currencies), user registration/auth, calculation history

│ ├── auth.ts # NextAuth configuration

│ ├── db.ts # Prisma client## Constitution Check

│ ├── validations.ts # Zod schemas

│ └── forex.ts # Forex calculation logic*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

└── globals.css # Tailwind CSS styles

### Accuracy First (NON-NEGOTIABLE)

prisma/

├── schema.prisma # Database schema- [x] Mathematical precision: Zod validation + decimal.js for currency calculations

└── migrations/ # Database migrations- [x] Real-time rates: Free forex API integration with fallback sources

- [x] Input validation: Form validation with proper error messages

tests/- [x] Results include: Margin requirements, pip values, position recommendations

├── **tests**/ # Jest unit tests

├── e2e/ # Playwright E2E tests### Real-Time Data Integration

└── fixtures/ # Test data

```- [x] Live forex rates: API integration with <1 minute refresh during market hours

- [x] Fallback sources: Multiple free API providers for redundancy

**Structure Decision**: Next.js full-stack with integrated frontend/backend- [x] Clear timestamps: Display last update time for all rates



## Progress Tracking### User Experience Priority



**Phase Status**:- [x] Simple interface: <3 clicks to calculation results

- [x] Phase 0: Research complete (/plan command)- [x] Mobile-responsive: Next.js + Tailwind CSS responsive design

- [x] Phase 1: Design complete (/plan command)  - [x] Clear error messages: Form validation with user-friendly feedback

- [x] Phase 2: Task planning complete (/plan command)- [x] Proper formatting: Decimal precision and currency formatting

- [ ] Phase 3: Tasks generated (/tasks command)

- [ ] Phase 4: Implementation complete### Risk Management Features

- [ ] Phase 5: Validation passed

- [x] Position sizing: Account balance + risk percentage calculations

**Gate Status**:- [x] Risk warnings: Visual alerts for >2% account risk positions

- [x] Initial Constitution Check: PASS- [x] Margin display: Show margin requirements and leverage

- [x] Post-Design Constitution Check: PASS  - [x] Educational tooltips: Forex terminology explanations

- [x] All NEEDS CLARIFICATION resolved

- [x] Complexity deviations documented### Performance & Reliability

- [x] Research artifacts generated

- [x] Design artifacts generated- [x] <2s page load: Next.js optimization + static generation

- [x] Contract specifications created- [x] <500ms calculations: Client-side computation with caching

- [x] Agent context updated- [x] 99.9% uptime: Vercel deployment with built-in reliability

- [x] API degradation: Local rate caching when APIs unavailable

---

*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*### Security & Compliance

- [x] HTTPS mandatory: Next.js default + Vercel SSL
- [x] No personal data storage: Only email/password for accounts
- [x] Secure credentials: Environment variables for API keys
- [x] Input sanitization: Zod validation prevents XSS/injection

### Technical Standards

- [x] Modern web tech: Next.js 15, TypeScript, React 18
- [x] PWA capabilities: Next.js PWA plugin for mobile installation
- [x] Cross-browser: Modern browser support via Next.js
- [x] Automated testing: Jest + Playwright test coverage

### SEO & User Acquisition

- [x] Semantic HTML: Next.js built-in SEO optimization
- [x] Meta optimization: next/seo for forex trading keywords
- [x] Core Web Vitals: Next.js performance optimization
- [x] Clean URLs: Next.js file-based routing
- [x] Schema markup: JSON-LD for financial calculator schema

## Project Structure

### Documentation (this feature)

```

specs/001-modern-and-super/
├── plan.md # This file (/plan command output)
├── research.md # Phase 0 output (/plan command)
├── data-model.md # Phase 1 output (/plan command)
├── quickstart.md # Phase 1 output (/plan command)
├── contracts/ # Phase 1 output (/plan command)
└── tasks.md # Phase 2 output (/tasks command - NOT created by /plan)

```

### Source Code (repository root)

```

# Next.js full-stack application structure

app/ # Next.js 15 App Router
├── (auth)/ # Auth route group
│ ├── login/
│ └── register/
├── api/ # API routes
│ ├── auth/
│ ├── calculations/
│ └── rates/
├── calculator/ # Main calculator page
├── dashboard/ # User dashboard
├── components/ # Shared React components
├── lib/ # Utilities and configurations
│ ├── auth.ts # NextAuth configuration
│ ├── db.ts # Prisma client
│ ├── validations.ts # Zod schemas
│ └── forex.ts # Forex calculation logic
└── globals.css # Tailwind CSS styles

prisma/
├── schema.prisma # Database schema
└── migrations/ # Database migrations

tests/
├── **tests**/ # Jest unit tests
├── e2e/ # Playwright E2E tests
└── fixtures/ # Test data

```

**Structure Decision**: Option 2 (Web application) - Next.js full-stack with integrated frontend/backend

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:

   - All technical choices resolved from user requirements (Next.js + PostgreSQL)
   - Free forex API research needed for rate sources
   - NextAuth.js configuration for simple email/password auth

2. **Generate and dispatch research agents**:

```

Task: "Research free forex API options for real-time exchange rates"
Task: "Find Next.js best practices for financial calculator applications"
Task: "Research Prisma schema patterns for user accounts and calculation history"
Task: "Find Tailwind CSS patterns for responsive forex trading interfaces"

```

3. **Consolidate findings** in `research.md` using format:
- Decision: [what was chosen]
- Rationale: [why chosen]
- Alternatives considered: [what else evaluated]

**Output**: research.md with technology decisions and API research

## Phase 1: Design & Contracts

_Prerequisites: research.md complete_

1. **Extract entities from feature spec** → `data-model.md`:

- User: email, password, registration date, preferred base currency
- Calculation: account balance, risk %, currency pair, lot size, position type, date
- CurrencyPair: base/quote currencies, exchange rate, timestamp, market status
- ExchangeRate: currency pair, bid/ask prices, timestamp, source provider

2. **Generate API contracts** from functional requirements:

- POST /api/calculations - Calculate lot size
- GET /api/calculations - Get user's saved calculations
- POST /api/calculations/save - Save calculation (auth required)
- DELETE /api/calculations/:id - Delete saved calculation
- GET /api/rates/:pair - Get current exchange rate
- Output OpenAPI schema to `/contracts/`

3. **Generate contract tests** from contracts:

- One test file per API endpoint
- Assert request/response schemas with Zod
- Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:

- Anonymous user calculation flow
- User registration and login flow
- Save calculation workflow
- View calculation history workflow
- Mobile responsive testing scenarios

5. **Update agent file incrementally** (O(1) operation):
- Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot`
- Add Next.js, TypeScript, Prisma, Tailwind CSS context
- Include forex calculation requirements
- Keep under 150 lines for token efficiency
- Output to `.github/copilot-instructions.md`

**Output**: data-model.md, /contracts/\*, failing tests, quickstart.md, .github/copilot-instructions.md

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each API contract → contract test task [P]
- Each entity → Prisma model creation task [P]
- Each user story → E2E test task
- Next.js pages and components implementation tasks
- Database setup and migration tasks

**Ordering Strategy**:

- TDD order: Tests before implementation
- Dependency order: Database schema → API routes → Components → Pages
- Mark [P] for parallel execution (independent files)
- Database setup first, then API contracts, then UI components

**Estimated Output**: 30-35 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

No constitutional violations detected. All requirements align with established principles.

## Progress Tracking

_This checklist is updated during execution flow_

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented
- [x] Research artifacts generated
- [x] Design artifacts generated
- [x] Contract specifications created
- [x] Agent context updated

---

_Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`_
```
