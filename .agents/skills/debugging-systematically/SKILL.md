---
name: debugging-systematically
description: Use when a bug, flaky test, runtime error, or unexpected behavior needs a reproducible root-cause analysis.
---

# Systematic debugging

1. Reproduce el problema y captura condiciones, logs relevantes y resultado esperado/actual.
2. Reduce el caso a la menor superficie posible.
3. Formula hipótesis diferenciadas y prueba la más probable con el menor experimento.
4. Inspecciona cambios recientes, límites de datos, configuración y dependencias externas.
5. Identifica causa raíz; evita cambios múltiples no relacionados.
6. Añade prueba de regresión cuando sea viable.
7. Repite pruebas y verifica que no se introduzcan regresiones.

## Output
Pasos de reproducción, causa raíz (o incertidumbre), evidencia, cambio, pruebas y riesgos restantes.
