# Política de operaciones

- No desplegar en producción ni ejecutar migraciones destructivas sin aprobación humana explícita.
- Antes de una migración: documentar impacto, backup/restore, compatibilidad y rollback.
- Los pipelines deben usar credenciales efímeras o de alcance mínimo cuando sea posible.
- No registrar tokens ni payloads sensibles en logs.
- Para cambios de infraestructura, inspeccionar el plan antes de aplicar.
- Cada despliegue debe tener criterio de salud, estrategia de rollback y responsable.
- Las acciones que generan costo externo o modifican datos deben ser confirmadas por una persona autorizada.
