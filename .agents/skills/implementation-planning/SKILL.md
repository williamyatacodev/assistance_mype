---
name: implementation-planning
description: Use for multi-step features, cross-module changes, migrations, or tasks where parallel work may be useful.
---

# Implementation planning

1. Usa requisitos y exploración como entradas.
2. Divide en entregables pequeños con dependencias explícitas.
3. Define contratos entre módulos antes de dividir frontend/backend o servicios.
4. Asigna ownership por archivo/módulo; evita escritores concurrentes sobre el mismo recurso.
5. Decide qué puede paralelizarse y qué requiere integración secuencial.
6. Vincula cada criterio de aceptación a una validación.
7. Incluye rollback o mitigación para cambios de datos/infraestructura.

## Output
Plan numerado, responsable/rol por tarea, dependencias, archivos probables, pruebas, riesgos y gates.
