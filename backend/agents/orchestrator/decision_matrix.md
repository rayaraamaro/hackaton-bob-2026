# Decision Matrix

## 1. Purpose

This file is consulted by the Orchestrator to decide which specialists to engage for each user request.

The decision matrix provides:
- **Keyword mapping** — Maps request topics to appropriate specialists
- **Common patterns** — Pre-defined specialist combinations for typical projects
- **Tie-breaking rules** — Guidelines when multiple specialists could apply
- **Exclusion rules** — When NOT to use specialists

The Orchestrator reads this file at the start of every request to determine the optimal execution plan.

---

## 2. Specialist Mapping Table

Use this table to map user request keywords and topics to the appropriate specialists:

| If the request involves... | Engage |
|---|---|
| Screens, frontend, components, layout, visual design, UI, pages, forms, buttons, navigation, responsive design, mobile-first | **UI Specialist** |
| Data modeling, schemas, tables, SQL, database design, entities, relationships, migrations, indexes, foreign keys, constraints | **Database Specialist** |
| REST endpoints, API contracts, backend integrations, CRUD endpoints, HTTP methods, request/response, Pydantic models, FastAPI routes | **API Specialist** |
| Business rules, complex validations, services, data processing, workflows, calculations, state transitions, domain logic, use cases | **Logic Specialist** |
| Online stores, products, cart, checkout, orders, payments, customers, e-commerce, shopping, inventory, catalog | **E-commerce Specialist** |
| Metrics, events, KPIs, dashboards, analytics, tracking, reporting, data aggregation, insights, statistics, monitoring | **Analytics Specialist** |
| Login, registration, JWT, password, roles, permissions, authentication, authorization, access control, user accounts, tokens, security | **Auth Specialist** |

### Usage Guidelines

**Single Keyword Match:**
- If request mentions "login" → Auth Specialist
- If request mentions "dashboard" → UI Specialist + Analytics Specialist
- If request mentions "database" → Database Specialist

**Multiple Keyword Match:**
- If request mentions "API" + "database" → Database Specialist → API Specialist
- If request mentions "frontend" + "API" → API Specialist → UI Specialist
- If request mentions "e-commerce" + "analytics" → E-commerce → Database → Logic → API → UI → Analytics

**Implicit Requirements:**
- If building a web app → likely needs Database + API + UI
- If building an API → likely needs Database + API (+ Auth if user-facing)
- If adding features to existing system → identify which specialists handle those features

---

## 3. Common Project Patterns

Pre-defined specialist combinations for typical project types:

### Full-Stack Web Application

**Specialists:** Auth → Database → Logic → API → UI

**When to use:**
- User requests a complete web application
- Mentions both frontend and backend
- Needs user authentication

**Example requests:**
- "Build a task management web app"
- "Create a blog platform with user accounts"
- "I need a project management tool"

**Execution flow:**
```
1. Auth Specialist — User authentication system
2. Database Specialist — Tables for users, tasks, projects, etc.
3. Logic Specialist — Business rules (task assignment, status transitions)
4. API Specialist — REST endpoints for all operations
5. UI Specialist — React frontend with all pages
```

### REST API Only (No Frontend)

**Specialists:** Auth → Database → Logic → API

**When to use:**
- User explicitly requests "API only" or "backend only"
- No mention of frontend, UI, or pages
- Focus on data and endpoints

**Example requests:**
- "Build a REST API for managing tasks"
- "Create a backend API for a mobile app"
- "I need API endpoints for product management"

**Execution flow:**
```
1. Auth Specialist — JWT authentication (if user-facing)
2. Database Specialist — Database schema
3. Logic Specialist — Business logic and services
4. API Specialist — REST endpoints
```

### E-commerce Platform

**Specialists:** E-commerce → Auth → Database → Logic → API → UI → Analytics (optional)

**When to use:**
- User mentions "e-commerce", "online store", "shop", "products", "cart", "checkout"
- Needs complete shopping experience

**Example requests:**
- "Build an e-commerce website"
- "Create an online store for selling products"
- "I need a shopping platform with cart and checkout"

**Execution flow:**
```
1. E-commerce Specialist — Define entities and specifications
2. Auth Specialist — Customer authentication
3. Database Specialist — Products, cart, orders, payments tables
4. Logic Specialist — Cart logic, checkout flow, stock management
5. API Specialist — CRUD endpoints for all entities
6. UI Specialist — Product pages, cart, checkout interface
7. Analytics Specialist — Track purchases and user behavior (optional)
```

### Analytics-Only Addition

**Specialists:** Database → Analytics → API

**When to use:**
- Adding analytics to an existing system
- User requests "tracking", "metrics", "reporting", "dashboard"
- System already exists, just needs analytics

**Example requests:**
- "Add analytics to track user behavior"
- "I need a dashboard showing sales metrics"
- "Add event tracking to the existing app"

**Execution flow:**
```
1. Database Specialist — Create event tables
2. Analytics Specialist — Define queries and aggregations
3. API Specialist — Create ingestion endpoint for events
```

### Frontend Only (API Exists)

**Specialists:** UI

**When to use:**
- User explicitly states API already exists
- Only needs frontend/UI
- Mentions "consume existing API"

**Example requests:**
- "Build a React frontend for my existing API"
- "Create a dashboard that calls these endpoints: [list]"
- "I have a backend, just need the UI"

**Execution flow:**
```
1. UI Specialist — React components consuming existing API
```

### Database Design Only

**Specialists:** Database

**When to use:**
- User only needs database schema
- Explicitly requests "database design" or "schema"
- No mention of API or frontend

**Example requests:**
- "Design a database schema for a blog"
- "I need SQL tables for an e-commerce system"
- "Create a PostgreSQL schema for task management"

**Execution flow:**
```
1. Database Specialist — SQL schema with tables and relationships
```

### Authentication Addition

**Specialists:** Auth → Database (if needed) → API

**When to use:**
- Adding authentication to existing system
- User requests "add login", "add authentication", "secure the API"

**Example requests:**
- "Add JWT authentication to my API"
- "I need user login and registration"
- "Secure the endpoints with authentication"

**Execution flow:**
```
1. Auth Specialist — Authentication system
2. Database Specialist — User table (if not exists)
3. API Specialist — Integrate auth with existing endpoints
```

---

## 4. Tie-Breaking Rules

When multiple specialists could handle a request, use these rules to decide:

### Rule 1: E-commerce Takes Priority

**If the request mentions:**
- "store", "shop", "products", "cart", "checkout", "e-commerce"

**Then:**
- ✅ Always start with E-commerce Specialist
- ✅ E-commerce Specialist will delegate to others
- ✅ Follow E-commerce → Auth → Database → Logic → API → UI flow

**Example:**
```
Request: "Build a product catalog with shopping cart"
Decision: Start with E-commerce Specialist (even though it could be just Database + API)
Reason: E-commerce domain expertise ensures proper entity design and business rules
```

### Rule 2: Auth for User/Customer Data

**If the request mentions:**
- "users", "customers", "accounts", "login", "registration"

**Then:**
- ✅ Always include Auth Specialist
- ✅ Auth Specialist defines user table early
- ✅ Other entities can reference users

**Example:**
```
Request: "Build a task manager where users can create tasks"
Decision: Include Auth Specialist (even if not explicitly mentioned)
Reason: "users" implies authentication and user management
```

### Rule 3: Analytics for Metrics/Tracking

**If the request mentions:**
- "metrics", "tracking", "analytics", "dashboard", "reports", "KPIs"

**Then:**
- ✅ Always include Analytics Specialist
- ✅ Analytics comes after core system is built
- ✅ Analytics adds event tracking on top

**Example:**
```
Request: "Build an app with a dashboard showing user activity"
Decision: Include Analytics Specialist for the dashboard
Reason: "dashboard" + "activity" implies metrics and tracking
```

### Rule 4: Visual Presentation = UI Only

**If the request is purely about:**
- Visual design, layout, styling, components
- No mention of data, API, or backend

**Then:**
- ✅ Use only UI Specialist
- ✅ Assume API already exists or will be provided

**Example:**
```
Request: "Create a beautiful product card component with image and price"
Decision: UI Specialist only
Reason: Pure visual component, no data layer needed
```

### Rule 5: Data Structure = Database First

**If the request focuses on:**
- Data modeling, entities, relationships
- No mention of API or UI

**Then:**
- ✅ Start with Database Specialist
- ✅ Can add API/UI later if needed

**Example:**
```
Request: "Design a schema for a blog with posts, comments, and tags"
Decision: Database Specialist only (unless user wants more)
Reason: Focus is on data structure, not implementation
```

### Rule 6: Business Logic = Logic Specialist

**If the request emphasizes:**
- Complex calculations, workflows, validations
- Business rules and processes

**Then:**
- ✅ Include Logic Specialist
- ✅ Logic comes after Database, before API

**Example:**
```
Request: "Implement a discount system with tiered pricing and coupon codes"
Decision: Database (discount tables) → Logic (discount calculation) → API (apply discount)
Reason: Complex business rules require Logic Specialist
```

---

## 5. When to Use NO Specialists

Some requests don't require engaging any specialists:

### Documentation Only

**When:**
- User asks for README, documentation, or explanations
- No code generation needed

**Examples:**
- "Write a README for this project"
- "Explain how to deploy this application"
- "Document the API endpoints"

**Action:**
- Orchestrator handles directly
- No specialist engagement needed

### Stack Questions or Advice

**When:**
- User asks about technology choices
- Requests recommendations or comparisons
- Seeks advice on architecture

**Examples:**
- "Should I use PostgreSQL or MongoDB?"
- "What's the best way to structure a React app?"
- "How do I deploy a FastAPI application?"

**Action:**
- Orchestrator answers based on pre-defined stack
- Explain pilot stack limitations
- No code generation

### Clarification or Discussion

**When:**
- User asks questions about the system
- Requests clarification on features
- Discusses requirements

**Examples:**
- "What features does the e-commerce system include?"
- "Can you explain how authentication works?"
- "What's the difference between PUT and PATCH?"

**Action:**
- Orchestrator responds conversationally
- May reference specialist documentation
- No code generation unless explicitly requested

### Modifications to Existing Code

**When:**
- User requests changes to already-generated code
- Wants to modify specific files

**Examples:**
- "Change the product price field to decimal(10,2)"
- "Add a 'status' field to the orders table"
- "Update the login endpoint to return user role"

**Action:**
- Orchestrator identifies which specialist's domain
- Re-engages that specialist with modification request
- Specialist updates their previous output

---

## Usage Examples

### Example 1: Vague Request

**User:** "I want to build a web app"

**Decision Process:**
1. Request is vague → Use Discovery Mode
2. Ask clarifying questions:
   - What is the purpose of the web app?
   - What features do you need?
   - Who are the users?
3. Based on answers, determine specialists
4. Present execution plan

**Possible Outcome:**
```
User clarifies: "A task management app for teams"
Specialists: Auth → Database → Logic → API → UI
```

### Example 2: Specific Request

**User:** "Build a REST API in FastAPI with PostgreSQL for managing tasks with JWT auth"

**Decision Process:**
1. Request is specific → Use Direct Mode
2. Keywords: "REST API", "FastAPI", "PostgreSQL", "tasks", "JWT auth"
3. Mapping:
   - "JWT auth" → Auth Specialist
   - "PostgreSQL" → Database Specialist
   - "REST API" → API Specialist
   - "tasks" → implies CRUD, needs Logic
4. Order: Auth → Database → Logic → API

**Execution Plan:**
```
1. Auth Specialist — JWT authentication system
2. Database Specialist — Tasks table + User table
3. Logic Specialist — Task management services
4. API Specialist — CRUD endpoints for tasks
```

### Example 3: E-commerce Request

**User:** "Create an online store with products, cart, and checkout"

**Decision Process:**
1. Keywords: "online store", "products", "cart", "checkout"
2. Mapping: "online store" → E-commerce Specialist
3. Tie-breaking: E-commerce takes priority
4. E-commerce will delegate to others

**Execution Plan:**
```
1. E-commerce Specialist — Define entities and specifications
2. Auth Specialist — Customer authentication
3. Database Specialist — Products, cart, orders tables
4. Logic Specialist — Cart logic, checkout flow
5. API Specialist — CRUD endpoints
6. UI Specialist — Shopping interface
```

### Example 4: Analytics Addition

**User:** "Add analytics to track user behavior in my existing app"

**Decision Process:**
1. Keywords: "analytics", "track", "existing app"
2. Mapping: "analytics" → Analytics Specialist
3. Pattern: Analytics-only addition
4. Needs: Database (events) → Analytics → API (ingestion)

**Execution Plan:**
```
1. Database Specialist — Create event tables
2. Analytics Specialist — Define tracking queries
3. API Specialist — Create event ingestion endpoint
```

### Example 5: Frontend Only

**User:** "Build a React dashboard that calls my existing API at http://api.example.com"

**Decision Process:**
1. Keywords: "React dashboard", "existing API"
2. Mapping: "React" → UI Specialist
3. Pattern: Frontend only
4. API already exists → UI only

**Execution Plan:**
```
1. UI Specialist — React dashboard consuming existing API
```

---

## Quick Reference

### Specialist Engagement Checklist

Before engaging specialists, verify:

- ✅ Request is clear (or discovery questions asked)
- ✅ Specialists identified using mapping table
- ✅ Tie-breaking rules applied if needed
- ✅ Execution order respects dependencies
- ✅ Context handoff plan defined

### Common Mistakes to Avoid

- ❌ Engaging specialists out of order (e.g., API before Database)
- ❌ Skipping Auth when users/customers are mentioned
- ❌ Not starting with E-commerce when store/products mentioned
- ❌ Engaging specialists for documentation-only requests
- ❌ Forgetting to pass context between specialists

### Decision Matrix Workflow

```
1. Parse user request
   ↓
2. Identify keywords
   ↓
3. Consult mapping table
   ↓
4. Apply tie-breaking rules
   ↓
5. Determine execution order
   ↓
6. Verify dependencies
   ↓
7. Engage specialists sequentially
```

---

**This decision matrix ensures consistent, optimal specialist selection for every request!** 🎯