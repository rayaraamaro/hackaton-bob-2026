# Agent Architecture

## Overview

This folder contains the **Markdown personas-based agent architecture** for the software development platform. In this architecture, **BOB acts as the orchestrator**, dynamically reading Markdown documents that describe each specialist agent and assuming their personas as needed to accomplish tasks.

## Architecture Concept

This is a **persona-based system** where:
- Each specialist is defined by a Markdown (`.md`) file that describes their expertise, capabilities, and behavior
- BOB reads these `.md` files and **assumes the persona** of each specialist when needed
- The orchestrator coordinates which specialists to engage based on the user's requirements
- All specialists are essentially BOB acting in different roles, guided by the persona definitions

## How It Works

1. **User Request**: User invokes BOB with a project request (e.g., "Create an e-commerce platform with analytics")
2. **Orchestration**: BOB reads `orchestrator/orchestrator.md` to understand how to coordinate the task
3. **Specialist Identification**: The orchestrator identifies which specialists are needed for the task
4. **Persona Assumption**: BOB reads each required specialist's `.md` file and assumes that persona
5. **Code Generation**: Acting as each specialist, BOB generates the appropriate code/output
6. **Integration**: The orchestrator ensures all specialist outputs work together cohesively

## Folder Structure

```
agents/
├── README.md                    # This file - architecture overview
├── orchestrator/                # Orchestrator and decision-making logic
│   ├── orchestrator.md         # Main orchestrator persona definition
│   └── decision_matrix.md      # Rules for selecting specialists
└── specialists/                 # Individual specialist persona definitions
    ├── ui_specialist.md        # Frontend specialist
    ├── database_specialist.md  # Database specialist
    ├── api_specialist.md       # API specialist
    ├── logic_specialist.md     # Business logic specialist
    ├── ecommerce_specialist.md # E-commerce specialist
    └── analytics_specialist.md # Analytics specialist
```

## Planned Specialists

### 1. UI Specialist (`ui_specialist.md`)
- **Technologies**: React + TypeScript + Tailwind CSS
- **Responsibilities**: Frontend components, user interfaces, responsive design
- **Expertise**: Modern React patterns, TypeScript best practices, accessible UI components

### 2. Database Specialist (`database_specialist.md`)
- **Technologies**: PostgreSQL (default) + Oracle
- **Responsibilities**: Database schema design, migrations, query optimization
- **Expertise**: Relational database design, indexing strategies, data integrity

### 3. API Specialist (`api_specialist.md`)
- **Technologies**: Python + FastAPI
- **Responsibilities**: RESTful API design, endpoint implementation, API documentation
- **Expertise**: FastAPI framework, async programming, API best practices

### 4. Logic Specialist (`logic_specialist.md`)
- **Technologies**: Python
- **Responsibilities**: Business rules, service layer, domain logic
- **Expertise**: Clean architecture, SOLID principles, business logic patterns

### 5. E-commerce Specialist (`ecommerce_specialist.md`)
- **Technologies**: Python + FastAPI (mocked)
- **Responsibilities**: E-commerce features, shopping cart, checkout flows
- **Expertise**: E-commerce patterns, payment integration concepts, order management

### 6. Analytics Specialist (`analytics_specialist.md`)
- **Technologies**: PostgreSQL + Python + Custom SQL
- **Responsibilities**: Data analysis, reporting, metrics calculation
- **Expertise**: SQL optimization, data aggregation, analytics patterns

## Usage Example

```
User: "I need an e-commerce platform with product catalog, shopping cart, and sales analytics"

BOB (as Orchestrator):
1. Reads orchestrator/orchestrator.md
2. Analyzes requirements
3. Identifies needed specialists:
   - UI Specialist (product pages, cart interface)
   - Database Specialist (product, order, customer tables)
   - API Specialist (product endpoints, cart API)
   - E-commerce Specialist (shopping cart logic, checkout)
   - Analytics Specialist (sales reports, metrics)

BOB (as each specialist):
4. Reads ui_specialist.md → generates React components
5. Reads database_specialist.md → designs database schema
6. Reads api_specialist.md → creates FastAPI endpoints
7. Reads ecommerce_specialist.md → implements cart logic
8. Reads analytics_specialist.md → builds reporting queries

BOB (as Orchestrator):
9. Integrates all outputs into cohesive solution
10. Ensures components work together
11. Delivers complete, working system
```

## Key Principles

1. **Single Actor, Multiple Personas**: BOB is the only agent, but assumes different expert personas
2. **Markdown-Driven**: All specialist knowledge is encoded in readable `.md` files
3. **Dynamic Coordination**: The orchestrator decides which specialists to engage per task
4. **Separation of Concerns**: Each specialist focuses on their domain expertise
5. **Cohesive Integration**: The orchestrator ensures all parts work together

## Development Status

- ✅ Architecture defined
- ⏳ Orchestrator implementation (pending)
- ⏳ Specialist personas (pending)
- ⏳ Decision matrix (pending)

## Next Steps

1. Implement `orchestrator/orchestrator.md` with coordination logic
2. Create `orchestrator/decision_matrix.md` with specialist selection rules
3. Define each specialist persona in `specialists/` folder
4. Test the architecture with sample projects
5. Refine personas based on real-world usage

---

**Note**: This architecture is designed to be extensible. New specialists can be added by simply creating new `.md` files in the `specialists/` folder with appropriate persona definitions.