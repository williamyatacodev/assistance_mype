---
name: code-review
description: Use to review a diff before merge, especially behavior changes, refactors, API changes, or concurrent contributions.
---

# Code review

1. Inspecciona diff completo y contexto de llamada; no te limites al resumen del autor.
2. Prioriza defectos funcionales, regresiones, seguridad, pérdida de datos y compatibilidad.
3. Comprueba manejo de errores, límites, autorización, concurrencia y observabilidad.
4. Comprueba que tests validan comportamiento y pueden detectar el defecto.
5. No reportes preferencias de estilo como bloqueantes salvo que violen una convención establecida.
6. Cada hallazgo debe indicar archivo/línea, escenario, impacto y corrección.
7. Si no hay hallazgos, indica el alcance revisado y las limitaciones; no afirmes ausencia absoluta de defectos.

## Output
Hallazgos priorizados; validaciones revisadas; limitaciones; recomendación: aprobar, cambios solicitados o revisión adicional.
