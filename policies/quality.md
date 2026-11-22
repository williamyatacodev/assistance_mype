# Política de calidad

## Checks
Cada proyecto define comandos reales para:
- formato y lint
- análisis estático / typecheck
- pruebas unitarias
- pruebas de integración
- E2E donde el riesgo lo justifique
- build de producción

## Reglas
- Un cambio de comportamiento requiere tests nuevos o una justificación explícita de por qué no son aplicables.
- Los tests deben validar comportamiento, no detalles internos frágiles.
- No bajar cobertura o deshabilitar pruebas para ocultar una regresión.
- Si no se pueden ejecutar tests, reportar la limitación y la evidencia disponible.
- Separar defectos preexistentes de los introducidos por el cambio.
