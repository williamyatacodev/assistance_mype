---
name: test-strategy
description: Use when adding behavior, fixing bugs, changing APIs/data models, or assessing whether a change is ready to merge.
---

# Test strategy

1. Mapear cada criterio de aceptación a uno o más tests.
2. Elegir el nivel más bajo que valide el comportamiento; agregar integración/E2E cuando haya límites reales.
3. Cubrir casos positivos, negativos, límites, permisos, fallos externos y regresiones relevantes.
4. Reutilizar fixtures y convenciones existentes.
5. Ejecutar primero checks rápidos; luego suite más amplia según riesgo.
6. Registrar comando, código de salida y resultado real.
7. Si no se ejecutó una prueba, indicar la razón; nunca inferir éxito.

## Output
Matriz requisito → prueba → resultado, comandos ejecutados, fallos, cobertura no probada y riesgos.
