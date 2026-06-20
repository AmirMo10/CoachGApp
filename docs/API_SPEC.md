# Coach"G" — API Specification

Base URL: `/api/v1` · Auth: `Authorization: Bearer <JWT>` · Format: JSON · Docs: Swagger at `/api/docs`.

All list endpoints support `?page`, `?pageSize`, `?sort`, `?q`. All mutating endpoints are audit-logged and RBAC-guarded.

## Auth
| Method | Path | Role | Description |
| ------ | ---- | ---- | ----------- |
| POST | `/auth/login` | public | Login (local fallback) → access+refresh tokens |
| POST | `/auth/refresh` | public | Exchange refresh token |
| POST | `/auth/logout` | any | Revoke session |
| GET  | `/auth/me` | any | Current user + role |

> In production, auth is delegated to Keycloak (OIDC). These endpoints proxy/validate.

## Clients (Coach)
| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/clients` | List coach's clients |
| POST | `/clients` | Create client profile |
| GET | `/clients/:id` | Client detail (profile, latest assessment, programs) |
| PATCH | `/clients/:id` | Update |
| DELETE | `/clients/:id` | Soft delete |
| GET | `/clients/:id/notes` · POST | Coach notes |
| GET | `/clients/:id/documents` · POST | Documents (presigned upload) |
| GET | `/clients/:id/messages` · POST | Messaging thread |

## Assessments
| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/clients/:id/assessments` | History (versioned) |
| POST | `/clients/:id/assessments` | New assessment |
| GET | `/assessments/:assessmentId` | Detail |

## Goals
| POST | `/clients/:id/goals` | Create goal |
| GET | `/clients/:id/goals` | List |

## Exercises (library)
| GET | `/exercises` | Filter: `?muscle`, `?equipment`, `?pattern`, `?difficulty`, `?sportTag` |
| GET | `/exercises/:id` | Detail |
| POST | `/exercises` | (Admin) create |
| PATCH/DELETE | `/exercises/:id` | (Admin) |

## Programs
| POST | `/clients/:id/programs/generate` | Run generation pipeline → program |
| GET | `/clients/:id/programs` | List |
| GET | `/programs/:programId` | Full program tree |
| PATCH | `/programs/:programId` | Coach overrides |
| POST | `/programs/:programId/explain` | Trigger AI explanation layer (async) |

**Generate request body:**
```json
{
  "goalId": "clx...",
  "periodization": "UNDULATING",
  "durationWeeks": 8,
  "daysPerWeek": 4
}
```

## Nutrition
| POST | `/clients/:id/nutrition/generate` | Compute plan from assessment + goal |
| GET | `/clients/:id/nutrition` | List plans |
| GET | `/nutrition/:planId` | Detail (macros + meals + shopping list) |

## Recovery
| POST | `/clients/:id/recovery/generate` | Generate recovery plan |
| GET | `/clients/:id/recovery` | List |

## Bloodwork
| POST | `/clients/:id/bloodwork` | Add panel + markers |
| GET | `/clients/:id/bloodwork` | List (educational insights; never diagnostic) |

## Progress
| POST | `/clients/:id/progress` | Add progress entry |
| GET | `/clients/:id/progress` | Time series for charts |
| POST | `/clients/:id/measurements` | Upload measurement/photo (presigned) |

## Reports
| POST | `/clients/:id/reports/generate` | Build premium PDF (async, BullMQ) → returns jobId |
| GET | `/reports/:reportId` | Status + download URL |

## Admin
| GET | `/admin/coaches` | Manage coaches |
| GET | `/admin/analytics` | Platform analytics |

## Health & Ops
| GET | `/health` | Liveness/readiness |
| GET | `/metrics` | Prometheus metrics |

## Standard error shape
```json
{ "statusCode": 400, "error": "Bad Request", "message": ["field x is required"], "traceId": "..." }
```
