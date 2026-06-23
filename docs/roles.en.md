---
tags:
  - documentation
---
# Roles

| Role | Responsibility |
| --- | --- |
| Discipline team | Creates standards, describes requirements, maintains measurement logic, and publishes discipline versions. |
| Development team | Maintains the application repository, declares the discipline version in use, and resolves non-compliance detected by the pipeline. |
| Exception owner | The person or team responsible for a temporary exception from the standard. They must track the reason, expiration date, and debt removal plan. |
| Reviewer | Reviews a standard, declaration, or exception change before merge. Confirms that the change is understandable and does not hide risk. |
| CI/CD pipeline | Performs the technical process: validates the declaration, runs checks, aggregates results, and makes the quality gate decision. |
| Scheduler | Runs the periodic refresh of the portal dashboard, independently of the development teams' work. |
