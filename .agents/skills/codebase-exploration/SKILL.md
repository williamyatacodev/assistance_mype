---
name: codebase-exploration
description: Use before changing an existing repository, when architecture, conventions, commands, or ownership are not already known.
---

# Codebase exploration

1. Lee instrucciones de raíz y de los directorios afectados.
2. Revisa `git status` y no sobrescribas cambios ajenos.
3. Localiza puntos de entrada, módulos relacionados, tests y configuración.
4. Sigue un flujo de datos representativo desde entrada hasta persistencia/salida.
5. Identifica versiones, gestor de paquetes, comandos reales y CI existente.
6. Busca un patrón similar antes de crear una abstracción nueva.
7. Registra incógnitas; consulta documentación oficial si una API/version es incierta.

## Output
Resumen de arquitectura relevante, archivos candidatos, patrones, comandos confirmados, riesgos y propuesta de alcance.
