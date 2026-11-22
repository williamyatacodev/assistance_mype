---
name: release-readiness
description: Use before merge/release/deployment, especially for schema changes, infrastructure changes, or production-impacting features.
---

# Release readiness

1. Confirma alcance y artefacto/version.
2. Revisa resultados reales de tests, lint, typecheck, build y escáneres configurados.
3. Revisa configuración y secretos sin imprimir sus valores.
4. Evalúa migraciones, compatibilidad, backup, rollback y feature flags.
5. Confirma aprobación necesaria y plan de observabilidad.
6. No despliegues ni apliques infraestructura sin autorización explícita.

## Output
Checklist con estado pass/fail/not-run, evidencias, riesgos, rollback y aprobaciones pendientes.
