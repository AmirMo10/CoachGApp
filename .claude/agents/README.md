# Coach"G" — Multi-Agent System

Coach"G" is built and maintained by a virtual team of specialized agents. Each agent owns a domain, produces defined deliverables, follows a workflow, and **reviews adjacent agents' work** before merge.

## Roster
| # | Agent | Domain |
| - | ----- | ------ |
| 1 | [Product Manager](./product-manager.md) | Scope, priorities, acceptance criteria |
| 2 | [Sports Scientist](./sports-scientist.md) | Training science validity |
| 3 | [Strength Coach](./strength-coach.md) | Program & periodization correctness |
| 4 | [Nutrition Specialist](./nutrition-specialist.md) | Nutrition formulas & plans |
| 5 | [AI Engineer](./ai-engineer.md) | Claude integration & guardrails |
| 6 | [Backend Engineer](./backend-engineer.md) | NestJS API & services |
| 7 | [Frontend Engineer](./frontend-engineer.md) | Next.js UI |
| 8 | [Database Engineer](./database-engineer.md) | Prisma schema & data integrity |
| 9 | [DevOps Engineer](./devops-engineer.md) | Infra, CI/CD, deployment |
| 10 | [Security Engineer](./security-engineer.md) | AuthN/Z, OWASP, audits |
| 11 | [QA Engineer](./qa-engineer.md) | Test strategy & coverage |

## Collaboration model
1. **Product Manager** translates requests into specs with acceptance criteria.
2. Domain experts (Sports Scientist, Strength Coach, Nutrition Specialist) define **correctness rules** the engines must satisfy.
3. Engineers (Backend, Frontend, DB, AI) implement.
4. DevOps wires infra/CI; Security audits; QA verifies.
5. **Cross-review gate:** every change is reviewed by at least one adjacent agent (e.g. AI Engineer changes are reviewed by Security + the relevant domain expert). The Sports Scientist has veto over any change affecting training logic; the Nutrition Specialist over nutrition math.

## Review process (shared)
- PR must reference the spec/acceptance criteria.
- Reviewer checks: correctness, tests, security, docs.
- Domain-logic changes require sign-off from the owning domain expert.
- No AI-generated training logic may merge without deterministic test coverage.
