<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>


# 🚚 SMG Backend - Logística Automotor

API REST construida con NestJS, Prisma y PostgreSQL para el sistema de gestión de logística automotor.

## 🌿 Flujo de Trabajo (Git Flow)

Este repositorio utiliza una estrategia de ramas estructurada para separar el desarrollo, las pruebas de integración y las entregas estables.

### Estructura de Ramas Principales
- **`main`**: Versión estable y de producción. Solo recibe código completamente probado. Es la rama que se presenta en cada entrega.
- **`staging`**: Entorno de pruebas. Versión desplegada para que el frontend realice pruebas de integración contra la API real.
- **`develop`**: Rama principal de integración. Todo el trabajo en curso de los desarrolladores se fusiona aquí primero.

### Ciclo de Vida de una Tarea (Issue)
1. Se crea una rama a partir de `develop` con el formato `feat/nombre-del-issue`, `fix/nombre-del-bug` o `chore/tarea`.
2. Se realiza el desarrollo y se suben los commits a esa rama.
3. Se abre un **Pull Request (PR) hacia `develop`** para revisión e integración.
4. Periódicamente, se abre un **PR de `develop` a `staging`** para liberar nuevas características al equipo de frontend.
5. Previo a una entrega formal, se abre un **PR de `staging` a `main`**.


## 🌍 Entornos
- **Staging (API de Pruebas):** `URL_PENDIENTE`