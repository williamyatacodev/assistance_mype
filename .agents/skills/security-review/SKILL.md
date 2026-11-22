---
name: security-review
description: Use for authentication, authorization, external input, data handling, dependencies, infrastructure, secrets, or pre-release reviews.
---

# Security review

1. Define activos, límites de confianza y datos sensibles afectados.
2. Inspecciona el diff y el camino completo de los datos.
3. Revisa autenticación, autorización del lado servidor, validación, inyección, SSRF, XSS, CSRF, secretos, logs y dependencias según aplique.
4. Para infraestructura, revisa privilegios, exposición de red, políticas y secretos.
5. Valida hallazgos con evidencia; no inventes vulnerabilidades.
6. No ejecutes exploits destructivos ni accedas a sistemas externos sin autorización.
7. Prioriza mitigaciones por severidad, probabilidad e impacto.

## Output
Hallazgo, severidad, evidencia, escenario de impacto, mitigación, estado de confirmación y áreas no revisadas.
