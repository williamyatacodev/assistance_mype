# Workflow: release

1. Confirmar alcance, versión, changelog y compatibilidad.
2. Ejecutar el pipeline completo definido por el proyecto.
3. Revisar vulnerabilidades, secretos, licencias y configuración.
4. Revisar migraciones, backups, rollback y feature flags.
5. Construir artefactos reproducibles y registrar sus identificadores.
6. Solicitar aprobación humana para producción.
7. Desplegar por etapas si la plataforma lo permite.
8. Verificar salud, errores y métricas tras el despliegue.
9. Ejecutar rollback si se supera el umbral de fallo definido.
10. Registrar resultado y acciones de seguimiento.
