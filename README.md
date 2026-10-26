<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# 🚚 SMG Backend - Logística Automotor

API REST construida con NestJS, Prisma y PostgreSQL para el sistema de gestión de logística automotor.

## 🚀 Tecnologías Principales

- **Framework:** [NestJS](https://nestjs.com/) (Node.js)
- **Lenguaje:** TypeScript
- **ORM:** [Prisma](https://www.prisma.io/)
- **Base de Datos:** PostgreSQL
- **Seguridad:** Autenticación JWT, Bcrypt, y RBAC (Role-Based Access Control) personalizado.

---

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

- **Staging (API de Pruebas):** `https://smg-backend-git-staging-faculedesmabertalots-projects.vercel.app/`

## 🛠️ Instalación y Puesta en Marcha (Getting Started)

Sigue estos pasos para levantar el entorno de desarrollo local. Es fundamental completarlos en orden para garantizar que la base de datos y la seguridad inicial se configuren correctamente.

### 1. Requisitos Previos
- [Node.js](https://nodejs.org/) (v18 o superior)
- Motor de base de datos **PostgreSQL** corriendo localmente (o en la nube).

### 2. Clonar el repositorio e instalar dependencias
```bash
git clone https://github.com/team-GitPushAndPray/smg_backend
cd smg_backend
npm install
```

### 3. Configurar Variables de Entorno
Duplica el archivo de configuración de ejemplo y renómbralo a `.env`. Este paso es obligatorio, ya que contiene secretos que no se versionan en Git.
```bash
cp .env.example .env
```
Abre el archivo `.env` y asegúrate de configurar correctamente:
- `DATABASE_URL`: La cadena de conexión a tu base de datos PostgreSQL.
- `JWT_SECRET`: Una clave secreta segura para firmar los tokens.
- `SUPERADMIN_EMAIL` y `SUPERADMIN_PASSWORD`: Credenciales para el usuario raíz.

### 4. Base de Datos (Prisma)
Ejecuta las migraciones para crear las tablas en tu base de datos y sincronizar el esquema. Luego, corre el seed para poblar el sistema con los módulos requeridos, roles de seguridad y el superusuario inicial:
```bash
# 1. Sincronizar esquema y generar el cliente de Prisma
npx prisma migrate dev

# 2. Poblar la base de datos con configuración base (Ejecutar Seed)
npm run seed
```

### 5. Levantar el Servidor
```bash
# Modo desarrollo (con hot-reload)
npm run start:dev
```
El servidor estará corriendo en `http://localhost:3000`. Ya puedes comenzar a realizar peticiones a la API.

---

## 📂 Estructura del Proyecto

El proyecto sigue los principios de **Clean Architecture** y **SOLID**, separando responsabilidades por dominios lógicos (módulos).

- ### `prisma/` - Modelado y Base de Datos

Contiene la configuración de Prisma ORM, actuando como la fuente de la verdad para la estructura de la base de datos.

- **`schema.prisma`**: Archivo central donde se modelan las tablas, las relaciones y se autogeneran los tipos estrictos de TypeScript.
- **`seed.ts`**: Script de inicialización encargado de poblar la base de datos de forma predecible con configuraciones del sistema (módulos, roles, superadmin) y datos de prueba.

- ### `src/auth/` Capa de Autenticación y Autorización (RBAC)

Gestiona la seguridad de la API, el inicio de sesión y el Control de Acceso Basado en Roles. Está subdividida según patrones de diseño estrictos:

- **`auth.controller.ts`**: Expone las rutas HTTP (ej. `POST /auth/login`). Recibe la petición y la delega, no contiene lógica de negocio.
- **`auth.service.ts`**: Contiene la lógica real: busca al usuario, compara el hash de la contraseña (con `bcrypt`) y genera el token JWT.
- **`auth.module.ts`**: El "empaquetador". Conecta los controladores, servicios, estrategias y el módulo oficial de JWT de NestJS.

- **`decorators/` (Etiquetas personalizadas)**
  - `modulo.decorator.ts`: Etiqueta las rutas indicando qué módulo y nivel de permiso exigen (ej: `@Modulo('MAQUINAS', { editar: true })`).
  - `public.decorator.ts`: Marca rutas específicas (como el login) para que ignoren el candado global de seguridad y sean de acceso público.

- **`dto/` (Validadores de entrada)**
  - `login.dto.ts`: Valida que el email tenga formato correcto y la contraseña no esté vacía al iniciar sesión.
  - `change-password.dto.ts`: Valida las reglas al solicitar un cambio de clave (contraseña actual vs. nueva).

- **`entities/` (Formateadores de salida)**
  - `auth.entity.ts`: Define la estructura exacta del JSON que se devuelve al hacer login (ej: el `accessToken` y los datos del usuario).
  - `usuario-auth.entity.ts`: Filtra los datos del usuario para asegurarse de que la contraseña hasheada jamás viaje al frontend.

- **`guards/` (Los "Porteros" de las rutas)**
  - `jwt-auth.guard.ts`: Verifica que la petición traiga un Token JWT válido, no expirado y bien firmado.
  - `modulos.guard.ts`: Lee la etiqueta `@Modulo`, revisa el rol del usuario y decide si tiene permiso para entrar a esa ruta específica.

- **`interfaces/` (Contratos de TypeScript)**
  - `jwt-payload.interface.ts`: Define qué datos viajan encriptados dentro del token (ej: `sub` (ID del usuario) y `rol_id`).
  - `auth-user.interface.ts`: Define la forma del objeto `req.user` que estará disponible en los controladores tras pasar la seguridad.

- **`strategies/` (Estrategias de Passport)**
  - `jwt.strategy.ts`: Es el motor detrás del `jwt-auth.guard`. Extrae el token de la cabecera (Bearer), lo decodifica y devuelve los datos del usuario para inyectarlos en la petición.

> **Nota de arquitectura:** La implementación de Guards y Decoradores sigue el principio de **Responsabilidad Única (SRP)** y **Programación Orientada a Aspectos**. Los controladores no contienen lógica de seguridad ni de permisos ("If user.rol === X"); simplemente declaran qué permisos requieren a través del decorador, y los Guards resuelven el acceso de forma agnóstica.

- ### `src/catalogo/` Capa de Catálogo Público

Maneja la exposición del inventario hacia el exterior (ej. la web pública de clientes). Su objetivo principal es mostrar únicamente lo que la empresa quiere que se vea, protegiendo los datos internos.

- **`catalogo.controller.ts`**: Punto de entrada HTTP (`GET /catalogo`). Expone las rutas públicas para listar y ver detalles de los equipos, separando el tráfico público del tráfico administrativo.
- **`catalogo.service.ts`**: Capa de negocio. Implementa el patrón "Proxy" o "Fachada": en lugar de consultar a Prisma directamente, delega la búsqueda al `EquiposService`, pero le inyecta filtros estrictos y obligatorios de forma silenciosa (como `activo: true` y `estado: 'disponible'`).
- **`catalogo.module.ts`**: Empaqueta el controlador y el servicio. Importa el `EquiposModule` para poder inyectar sus servicios, fomentando la reutilización de código entre dominios sin duplicar consultas a la base de datos.

- **`dto/` (Filtros de Búsqueda y Validación)**
  - `filtro-catalogo.dto.ts`: Valida y limpia los parámetros de búsqueda que llegan por la URL (Query Params), asegurando que los tipos de datos (como `categoriaId`) sean correctos para filtrar el catálogo público.
  - `update-catalogo.dto.ts`: Valida las reglas de negocio en caso de que existan configuraciones o preferencias editables exclusivas para la vista del catálogo.

- **`entities/` (Serialización de Salida)**
  - `catalogo-equipo.entity.ts`: Define la estructura del JSON que se envía al exterior. Es una capa de seguridad vital: asegura que datos administrativos, métricas internas o historiales no se filtren accidentalmente a la web pública, devolviendo un objeto "limpio" solo con información comercial.

- ### `src/common/` Capa de Utilidades Compartidas (Cross-Cutting Concerns)

Alberga recursos, clases y validaciones globales que son transversales a toda la aplicación. Su propósito es centralizar elementos que se repiten en múltiples módulos, garantizando la consistencia y respetando el principio **DRY (Don't Repeat Yourself)**.

- **`dto/` (Validadores Globales)**
  - `pagination.dto.ts`: Define y valida los parámetros de paginación universales (ej: `page` y `limit`) que se envían por Query Params. Al centralizar esto, se garantiza que todos los endpoints de listado (ya sean equipos, usuarios, o catálogo) paginen exactamente de la misma forma, unificando el contrato de la API para el equipo de Frontend.

- ### `src/equipos/` Capa de Dominio de Inventario

Es el módulo central (Core Domain) del backend. Gestiona todo el ciclo de vida del parque automotor, equipos pesados y aditamentos, aplicando estrictas reglas de negocio para asegurar la integridad de los datos logísticos.

- **`equipos.controller.ts`**: Expone la API REST para el CRUD (crear, leer, actualizar) y las operaciones atómicas del inventario. Está fuertemente protegido por los Guards de autorización (`@Modulo('MAQUINAS')`).
- **`categorias.controller.ts`**: Maneja los endpoints específicos para la consulta de las categorías de los equipos. Al tener su propio controlador, se separa limpiamente la lógica (ideal para poblar los selectores o menús desplegables en el frontend de forma ágil).
- **`equipos.service.ts`**: Centraliza las reglas de negocio (invariantes). Maneja la mutación anidada en Prisma (polimorfismo entre `Equipo`, `Maquina` y `Aditamento`), validaciones de códigos internos únicos, y el ciclo de vida (bajas lógicas, horómetros que no pueden retroceder).
- **`equipos.module.ts`**: Empaqueta el dominio. Registra ambos controladores y exporta `EquiposService` para que otros módulos (como Catálogo o futuros Alquileres/Taller) puedan interactuar con el inventario sin duplicar lógica ni hacer consultas directas a Prisma.

- **`decorators/` (Validadores Personalizados)**
  - `is-maquina.decorator.ts`: Decorador de validación custom. Implementa lógica condicional avanzada para exigir que campos exclusivos de motores (año, modelo, número de serie, horómetro) solo se envíen si el tipo de equipo es "máquina", bloqueándolos si es un "aditamento".

- **`dto/` (Transferencia y Validación de Datos)**
  - `create-equipo.dto.ts` / `update-equipo.dto.ts`: Validan los datos generales de alta y edición de la ficha técnica. Trabajan en conjunto con el decorador `@IsMaquina()` para garantizar la coherencia de los datos entrantes.
  - `filtro-equipos.dto.ts`: Tipa y valida los parámetros de búsqueda (Query Params), permitiendo búsquedas insensibles a mayúsculas, filtrado por estados y categorías.
  - `update-horas-equipo.dto.ts` y `update-estado-equipo.dto.ts`: DTOs **atómicos**. Aplicando el Principio de Responsabilidad Única (SRP), separan las acciones críticas (actualizar un horómetro o cambiar un estado operativo) de la edición general, evitando vulnerabilidades de seguridad y garantizando que las reglas de negocio se respeten.

- **`entities/` (Representación de Salida)**
  - `equipo.entity.ts`: Mapea las respuestas de Prisma, aplanando las relaciones anidadas (ej: extrayendo las horas de la tabla `maquina` hacia el primer nivel del JSON) para entregarle al Frontend una estructura limpia, predecible y lista para renderizar.

- ### `src/modulos/` Capa de Gestión de Módulos (Core RBAC)

Administra las entidades que representan las distintas secciones o dominios de la aplicación (ej: MAQUINAS, CONFIGURACION). Es una pieza fundamental de la arquitectura de seguridad y de la construcción de la UI, ya que alimenta dinámicamente el sistema de menús del frontend según los permisos del usuario.

- **`modulos.controller.ts`**: Expone las rutas para consultar los módulos disponibles. Esto permite que el frontend (React/Vite) dibuje dinámicamente la barra lateral (Sidebar) mostrando únicamente las pantallas a las que el usuario autenticado tiene acceso.
- **`modulos.service.ts`**: Consulta la base de datos para recuperar los módulos activos y su configuración, aislando a los controladores de las transacciones directas.
- **`modulos.module.ts`**: Empaqueta el dominio para inyectarlo de manera limpia en la aplicación.

- **`decorators/` (Metadatos de Seguridad)**
  - `modulo.decorator.ts`: _(Si decidiste ubicarlo o referenciarlo en este dominio)_ Define el decorador custom `@Modulo()` que inyecta la metadata exacta (nombre del módulo y nivel de acceso) que requiere una ruta, conectando directamente este dominio con el `ModuloAccessGuard` de la capa de Auth.

- **`entities/` (Sanitización y Serialización)**
  - `modulo.entity.ts`: Clase que mapea el resultado de la base de datos antes de enviarlo por la red. Se encarga de transformar y sanitizar los datos (por ejemplo, garantizando que códigos internos viajen en un formato predecible como MAYÚSCULAS) para evitar inconsistencias visuales o lógicas en el frontend.

### `src/prisma/` - Capa de Persistencia

Centraliza la conexión a la base de datos utilizando **Prisma ORM**, garantizando una única instancia de conexión (patrón Singleton) para toda la aplicación y evitando fugas de memoria.

- **`prisma.service.ts`**: Extiende de `PrismaClient` y maneja el ciclo de vida de la conexión a la BD.
- **`prisma.module.ts`**: Empaqueta y exporta el servicio.

> **Nota de arquitectura:** Los controladores (`Controllers`) nunca interactúan directamente con Prisma. La base de datos solo es accedida a través de los Servicios (`Services`), respetando el principio de Responsabilidad Única.

- ### `src/roles/` Capa de Gestión de Roles y Permisos

Administra los perfiles de usuario y la asignación dinámica de privilegios en el sistema. Es el motor administrativo del esquema RBAC (Role-Based Access Control).

- **`roles.controller.ts`**: Expone los endpoints para el ABM (CRUD) de roles y la configuración de la matriz de permisos.
- **`roles.service.ts`**: Ejecuta la lógica de negocio. Se encarga de manejar operaciones transaccionales complejas en Prisma, como la actualización masiva de la matriz de permisos (asociando un Rol con múltiples Módulos y definiendo su bandera `puede_editar`).
- **`roles.module.ts`**: Empaqueta y aísla el dominio de roles.

- **`dto/` (Validación de Configuración)**
  - `create-rol.dto.ts` y `update-rol.dto.ts`: Validan los datos base de un perfil (nombre, descripción, si es un rol de sistema intocable, etc.).
  - `update-rol-modulos.dto.ts`: DTO estructural avanzado. Valida la recepción de la matriz de permisos completa (relación muchos a muchos), asegurando que los identificadores de los módulos y los booleanos de edición tengan el formato exacto antes de que el servicio borre o reemplace permisos en la base de datos.

- **`entities/` (Serialización y Relaciones)**
  - `rol.entity.ts`: Formatea la respuesta HTTP. Estructura limpiamente la información del rol junto con sus permisos asociados (resolviendo las relaciones anidadas de Prisma) para que el Frontend pueda construir las pantallas de administración de perfiles sin tener que parsear datos complejos.

- ### `src/usuarios/` Capa de Gestión de Usuarios y Cuentas

Administra el ciclo de vida de los operadores del sistema, la asignación de perfiles y la seguridad de las credenciales.

- **`usuarios.controller.ts`**: Expone la API REST para el ABM (Alta, Baja y Modificación) de las cuentas de usuario.
- **`usuarios.service.ts`**: Centraliza la lógica de negocio. Se encarga de validar invariantes (como la unicidad del correo electrónico) y de aplicar funciones hash criptográficas (con `bcrypt`) a las contraseñas antes de interactuar con Prisma.
- **`usuarios.module.ts`**: Empaqueta y aísla el dominio de usuarios.

- **`dto/` (Validación de Entrada y SRP)**
  - `create-usuario.dto.ts` y `update-usuario.dto.ts`: Validan la estructura de datos para la creación y edición general del perfil (nombres, email, ID de rol asignado).
  - `update-estado-usuario.dto.ts`: DTO **atómico**. Siguiendo el mismo patrón de Responsabilidad Única (SRP) aplicado en los equipos, separa la acción crítica de suspender o reactivar una cuenta (baja lógica) del endpoint de edición general, evitando modificaciones de seguridad accidentales.

- **`entities/` (Sanitización de Datos Sensibles)**
  - `usuario.entity.ts`: Capa fundamental para la seguridad perimetral. Formatea el objeto devuelto por Prisma y utiliza herramientas de interceptación (como `@Exclude()` de `class-transformer`) para garantizar matemáticamente que los hashes de las contraseñas **jamás** se incluyan en las respuestas HTTP enviadas al frontend.

- ### `src/vendedores/` Capa de Gestión Comercial (Fuerza de Ventas)

Administra la información y el ciclo de vida de los representantes comerciales de la empresa. Este módulo es el pilar para futuras integraciones donde se vincule el alquiler o asignación de equipos con el equipo de ventas.

- **`vendedores.controller.ts`**: Expone los endpoints REST para el ABM del equipo comercial. Al igual que el resto del sistema, sus rutas están protegidas bajo el sistema dinámico de control de acceso (`@Modulo('VENDEDORES')`).
- **`vendedores.service.ts`**: Capa de negocio. Centraliza la comunicación con Prisma para procesar la creación, lectura, y modificación de los perfiles comerciales, manteniendo las reglas de negocio aisladas del controlador.
- **`vendedores.module.ts`**: Empaqueta el controlador y el servicio, manteniendo el dominio comercial encapsulado e independiente (cohesión alta y acoplamiento bajo).

- **`dto/` (Validación de Entrada)**
  - `create-vendedores.dto.ts`: Define y valida estáticamente el contrato de datos requeridos para registrar a un nuevo representante comercial (nombres, contactos, zonas, etc.), asegurando que no ingrese basura a la base de datos.
  - `update-vendedores.dto.ts`: Valida las modificaciones sobre vendedores existentes. Suele utilizar patrones de herencia (como `PartialType`) para permitir actualizaciones parciales seguras mediante peticiones PATCH.

- ### `src/` (Archivos Raíz) - main y Orquestación
Son los puntos de entrada que levantan y configuran el núcleo de la aplicación NestJS.
  - **`main.ts`**: El archivo de arranque (main). Aquí se levanta el servidor HTTP, se configuran las políticas de seguridad (CORS) y se inyectan los "Pipes" globales (como el `ValidationPipe` que hace funcionar a todos los DTOs del sistema).
  - **`app.module.ts`**: El módulo raíz de la aplicación. Actúa como el gran orquestador que importa y conecta todos los módulos de dominio (`EquiposModule`, `AuthModule`, etc.) y configura módulos globales (como el `ConfigModule` para las variables de entorno).
  - **`app.controller.ts` y `app.service.ts`**: Generalmente utilizados como un "Health Check" (ej: `GET /` -> "API Online") para que los balanceadores de carga o servicios de hosting verifiquen que el servidor está vivo.

---

## ⚙️ Configuración y Variables de Entorno (Directorio Raíz)

Fuera de la carpeta `src/`, el proyecto cuenta con archivos críticos para el ecosistema, el despliegue y las dependencias:

- **`.env.example`**: Plantilla de seguridad que documenta todas las variables de entorno que el sistema necesita para funcionar (URL de la base de datos PostgreSQL, secretos de encriptación JWT, correos de superadmin, puertos). **Regla de oro:** Jamás se sube el archivo `.env` real al repositorio, cualquier desarrollador nuevo debe clonar este `.env.example`.
- **`package.json`**: Define las dependencias del proyecto (NestJS, Prisma, Bcrypt, Class-Validator) y los scripts de ejecución (`npm run start:dev`, `npm run seed`, etc.).
- **`.eslintrc.js` y `.prettierrc`**: Aseguran que todo el equipo de desarrollo mantenga el mismo estándar estricto de estilo de código (linting y formateo automático).

## 🧪 Pruebas y Documentación de la API

Las pruebas de los endpoints y flujos de negocio (ciclo de vida del inventario, horómetros, bajas lógicas, control de acceso) se validan a través de **Postman**. 