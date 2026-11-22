# Workflow: bugfix

1. Reproducir el fallo o documentar exactamente por qué no puede reproducirse.
2. Determinar el comportamiento esperado y el actual.
3. Identificar causa raíz antes de editar; evitar arreglos especulativos.
4. Añadir una prueba de regresión que falle antes del arreglo cuando sea viable.
5. Implementar el cambio mínimo.
6. Ejecutar prueba de regresión y checks relevantes.
7. Revisar efectos colaterales, logs, compatibilidad y manejo de errores.
8. Informar causa raíz, corrección, evidencias y riesgos restantes.
