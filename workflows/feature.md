# Workflow: nueva funcionalidad

1. **Clasificar**: aclarar objetivo, usuarios afectados, alcance, riesgo y criterios de aceptación.
2. **Explorar**: leer instrucciones del repo, estructura, patrones existentes, dependencias y git status.
3. **Planificar**: listar cambios, pruebas, riesgos, decisiones y módulos propietarios.
4. **Definir contratos**: API, tipos compartidos, esquema de datos, eventos y errores antes de dividir trabajo.
5. **Implementar**: asignar ownership por módulo; no permitir edición concurrente de los mismos archivos.
6. **Validar**: ejecutar lint/typecheck/tests/build y pruebas adicionales según riesgo.
7. **Revisar**: un revisor independiente inspecciona diff, seguridad y regresiones.
8. **Integrar**: resolver conflictos y repetir checks sobre el resultado integrado.
9. **Cerrar**: resumir evidencia, limitaciones, documentación y pasos de despliegue.

Gate: no pasar a la siguiente fase si falta una decisión bloqueante, falla un check obligatorio o existe un hallazgo crítico sin resolver.
