# StudyHub

> Plataforma web full-stack para estudiantes universitarios que centraliza notas con editor enriquecido, gestión de tareas en matriz Eisenhower y temporizador de estudio con estadísticas.

**Asignatura:** Desarrollo Web  
**Institución:** Fundación Universitaria del Área Andina  
**Autor:** Diego  
**Fecha de entrega:** 20 de Abril de 2026

---

## Tabla de contenidos

1. [Descripción general](#descripción-general)
2. [Stack técnico](#stack-técnico)
3. [Arquitectura](#arquitectura)
4. [Estructura del proyecto](#estructura-del-proyecto)
5. [Módulos](#módulos)
6. [Instalación](#instalación)
7. [Variables de entorno](#variables-de-entorno)
8. [Base de datos](#base-de-datos)
9. [Scripts disponibles](#scripts-disponibles)
10. [Seguridad](#seguridad)
11. [Deploy](#deploy)
12. [Limitaciones y trabajo futuro](#limitaciones-y-trabajo-futuro)

---

## Descripción general

StudyHub es una aplicación web construida con **Next.js 16** y **Supabase** que integra en una sola plataforma las herramientas que un estudiante universitario necesita en su día a día:

- **Notas** con editor de texto enriquecido (Tiptap), organización en carpetas y sistema de etiquetas.
- **Tareas** organizadas en la Matriz de Eisenhower con tablero Kanban y drag & drop.
- **Temporizador** Pomodoro y libre con historial de sesiones y estadísticas visuales.

Todo con autenticación segura, datos aislados por usuario mediante Row Level Security y diseño responsivo.

---

## Stack técnico

| Capa | Tecnología | Versión | Justificación |
|------|-----------|---------|---------------|
| Framework | Next.js + App Router | 16 | SSR, Server Components, routing nativo por carpetas |
| Lenguaje | TypeScript | 5.x | Seguridad de tipos en compilación, mejor mantenibilidad |
| Estilos | Tailwind CSS | v4 | Utilidades atómicas, sin CSS extra, purging automático |
| Base de datos | Supabase (PostgreSQL) | — | BaaS completo: DB, Auth y Storage en un solo servicio |
| Autenticación | Supabase Auth | — | Integrado con RLS, JWT seguro por defecto |
| Editor rich text | Tiptap | 3 | Extensible, basado en ProseMirror, accesible |
| Gráficas | Recharts | — | API declarativa, compatible con React 19 |
| Drag & drop | dnd-kit | — | Accesible, optimizado para web, sin dependencias |
| Validación | Zod | v4 | Type-safe, integración directa con react-hook-form |
| Formularios | react-hook-form | — | Sin re-renders innecesarios, API sencilla |
| Fechas | date-fns | — | Modular y tree-shakeable, sin clases |
| Toasts | Sonner | — | Minimalista, accesible, cero configuración |

---

## Arquitectura

### Patrón MVC

StudyHub implementa el patrón **Modelo — Vista — Controlador** aprovechando las primitivas de Next.js App Router:

```
┌─────────────────────────────────────────────────────────────────┐
│                        VISTA (View)                             │
│  components/categories/                                         │
│  ├── CategoriesClient.tsx   ← orquestador, gestión de estado    │
│  ├── CategoryForm.tsx       ← formulario con react-hook-form    │
│  └── CategoryList.tsx       ← lista con acciones editar/borrar  │
└──────────────────────┬──────────────────────────────────────────┘
                       │ llama Server Actions
┌──────────────────────▼──────────────────────────────────────────┐
│                    CONTROLADOR (Controller)                      │
│  app/(app)/categories/actions.ts                                 │
│  ├── createCategoryAction()  ← valida con Zod → invoca modelo   │
│  ├── updateCategoryAction()  ← valida con Zod → invoca modelo   │
│  └── deleteCategoryAction()  ← verifica sesión → invoca modelo  │
└──────────────────────┬──────────────────────────────────────────┘
                       │ instancia y llama métodos
┌──────────────────────▼──────────────────────────────────────────┐
│                      MODELO (Model / DAO)                        │
│  lib/models/                                                     │
│  ├── BaseModel.ts        ← clase abstracta con handleError()    │
│  └── CategoryModel.ts    ← CRUD + reglas de negocio:            │
│      ├── findAllByUser()     nombre 2–40 caracteres             │
│      ├── findById()          color hex válido (#RRGGBB)         │
│      ├── findByName()        sin nombres duplicados por usuario │
│      ├── create()            orphan cleanup al eliminar         │
│      ├── update()                                               │
│      └── delete()                                               │
└──────────────────────┬──────────────────────────────────────────┘
                       │ cliente @supabase/supabase-js (ORM ligero)
┌──────────────────────▼──────────────────────────────────────────┐
│               CAPA DE DATOS (Supabase / PostgreSQL)              │
│  tabla categories con RLS: cada usuario accede solo a sus filas  │
└─────────────────────────────────────────────────────────────────┘
```

| Componente MVC | Implementación en StudyHub | Tecnología |
|---|---|---|
| **Vista** | `components/categories/` — Client Components con `"use client"` | React 19 + react-hook-form |
| **Controlador** | `app/(app)/categories/actions.ts` — Server Actions | Next.js Server Actions |
| **Modelo** | `lib/models/CategoryModel.ts` — clase con responsabilidad única | TypeScript + Supabase JS |
| **Patrón DAO** | `CategoryModel` encapsula todo acceso a la tabla `categories` | Clase con métodos CRUD |
| **Patrón ORM** | `@supabase/supabase-js` traduce métodos encadenados a SQL | `.from().select().eq()` |

**Flujo completo de una mutación (crear categoría):**

```
1. Usuario completa CategoryForm y hace submit
2. react-hook-form valida con zodResolver (client-side)
3. Se invoca createCategoryAction() [Server Action]
4. El controlador valida el input con Zod (server-side)
5. El controlador instancia CategoryModel(supabase)
6. CategoryModel.create() aplica reglas de negocio:
   - valida nombre (2–40 chars) y color (hex válido)
   - verifica que no exista otro con el mismo nombre
7. Inserta en Supabase; RLS confirma que user_id = auth.uid()
8. El controlador llama revalidatePath('/categories')
9. La vista recibe { ok: true, data: category } y muestra toast
```

**Flujo de autenticación:**

1. El usuario inicia sesión con Supabase Auth (email + password).
2. El middleware (`middleware.ts`) valida la sesión en cada ruta protegida.
3. Las rutas del grupo `(app)/` requieren sesión activa; las de `(auth)/` redirigen si ya hay sesión.
4. Supabase RLS garantiza que cada usuario solo acceda a sus propios datos.

---

## Estructura del proyecto

```
studyhub/
├── app/
│   ├── (auth)/
│   │   ├── login/              # Página de inicio de sesión
│   │   └── register/           # Página de registro
│   ├── (app)/
│   │   ├── dashboard/          # Resumen: notas recientes, tareas pendientes, sesiones
│   │   ├── notes/              # Lista de notas con carpetas y tags
│   │   ├── notes/[noteId]/     # Editor individual de nota (Tiptap)
│   │   ├── tasks/              # Kanban Eisenhower con drag & drop
│   │   ├── timer/              # Temporizador + historial + estadísticas
│   │   ├── categories/         # CRUD de categorías
│   │   └── profile/            # Perfil y configuración de usuario
│   ├── layout.tsx              # Layout raíz con fuentes y providers
│   └── globals.css             # Variables CSS y reset global
│
├── components/
│   ├── notes/
│   │   ├── NoteEditor.tsx      # Editor Tiptap con toolbar completa
│   │   └── NotesClient.tsx     # Lista de notas, filtros y carpetas
│   ├── tasks/
│   │   ├── KanbanColumn.tsx    # Columna droppable del kanban
│   │   ├── TaskCard.tsx        # Tarjeta draggable de tarea
│   │   ├── TaskModal.tsx       # Modal de detalle con subtareas y deadline
│   │   └── TasksClient.tsx     # Orquestador del tablero Eisenhower
│   ├── timer/
│   │   ├── TimerClient.tsx     # Temporizador SVG circular, modos Simple y Pomodoro
│   │   ├── SessionHistory.tsx  # Historial de sesiones completadas
│   │   └── StudyStats.tsx      # Gráfico de barras diario + torta por categoría
│   └── shared/
│       ├── Navbar.tsx          # Barra de navegación lateral responsiva
│       ├── CategoriesClient.tsx# Formulario y lista de categorías
│       └── ProfileClient.tsx   # Formulario de perfil de usuario
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Cliente Supabase para componentes cliente
│   │   ├── server.ts           # Cliente Supabase para Server Components
│   │   └── middleware.ts       # Cliente Supabase para middleware
│   ├── models/                 # ← Capa de Modelos (Eje 2 — patrón MVC/DAO)
│   │   ├── BaseModel.ts        # Clase abstracta base con manejo de errores
│   │   ├── CategoryModel.ts    # DAO de categorías: CRUD + reglas de negocio
│   │   └── index.ts            # Barrel export
│   ├── types.ts                # Interfaces y tipos TypeScript compartidos
│   └── utils.ts                # Utilidades: cn(), formatDate(), formatDuration()
│
├── supabase/
│   └── migrations/
│       ├── 001_initial.sql     # Esquema completo de la base de datos
│       └── 002_categories_constraints.sql  # Constraints y RLS granular (Eje 2)
│
├── public/
│   └── sounds/
│       └── bell.mp3            # Sonido de notificación del temporizador
│
├── middleware.ts               # Protección de rutas y refresco de sesión
├── .env.local                  # Variables de entorno (no incluido en el repo)
├── .env.example                # Plantilla de variables de entorno
└── next.config.ts              # Configuración de Next.js
```

---

## Módulos

### Notas

Permite crear, editar y organizar notas académicas con formato enriquecido.

**Funcionalidades:**
- Editor Tiptap con toolbar completa: negrita, cursiva, encabezados H1–H3, código en línea, bloques de código, cita, listas ordenadas/desordenadas, checklists e imágenes.
- Organización en **carpetas** con contador de notas por carpeta.
- Sistema de **tags** con filtro por chip seleccionable.
- **Autoguardado** con debounce de 1 segundo (sin botón de guardar explícito).
- Subida de imágenes directamente a **Supabase Storage**.

---

### Tareas — Matriz de Eisenhower

Organiza tareas según urgencia e importancia en un tablero Kanban de 4 cuadrantes.

| Cuadrante | Criterio | Acción |
|-----------|----------|--------|
| Hacer ahora | Urgente + Importante | Ejecutar inmediatamente |
| Planificar | No urgente + Importante | Agendar |
| Delegar | Urgente + No importante | Asignar a otro |
| Eliminar | No urgente + No importante | Descartar |

**Funcionalidades:**
- **Drag & drop** entre columnas con dnd-kit.
- **Modal de detalle** con subtareas anidadas, fecha límite (deadline) y categoría.
- Filtro por categoría y toggle para mostrar/ocultar tareas completadas.
- **Actualizaciones optimistas** para experiencia fluida sin esperar respuesta del servidor.

---

### Temporizador de estudio

Registra sesiones de estudio con estadísticas para seguimiento del hábito.

**Modos:**
- **Simple:** duración libre de 10 a 120 minutos ajustable con slider.
- **Pomodoro:** ciclos de 25 min trabajo / 5 min descanso corto / 15 min descanso largo.

**Funcionalidades:**
- Display circular animado en SVG con cuenta regresiva.
- Estado persistido en `localStorage` para sobrevivir recargas de página.
- Guarda sesiones completadas o detenidas en Supabase.
- **Notificaciones sonoras** (Web Audio API con `bell.mp3` como recurso) y **Web Notifications API** (requiere permiso del navegador).
- **Historial** de sesiones con fecha, duración y categoría.
- **Estadísticas:** gráfico de barras con minutos por día (últimos 7 días) y gráfico de torta con distribución por categoría.

---

## Instalación

### Requisitos previos

- Node.js 20 o superior
- Cuenta en [supabase.com](https://supabase.com) (plan gratuito suficiente)

### Pasos

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd studyhub

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con las credenciales de Supabase (ver sección siguiente)

# 4. Ejecutar migraciones en Supabase (en orden)
# Ir a supabase.com → SQL Editor → pegar y ejecutar:
# supabase/migrations/001_initial.sql
# supabase/migrations/002_categories_constraints.sql

# 5. Iniciar el servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

---

## Variables de entorno

Copiar `.env.example` a `.env.local` y completar los valores:

```env
# URL pública del proyecto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co

# Clave anónima pública (segura para el cliente)
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key

# Clave de servicio (solo en servidor, nunca expuesta al cliente)
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

Las claves se encuentran en el dashboard de Supabase en **Settings → API**.

> **Importante:** `.env.local` está en `.gitignore` y nunca debe subirse al repositorio.

---

## Base de datos

El esquema se construye en dos migraciones ejecutadas en orden:

### `001_initial.sql` — Esquema base

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Perfil extendido del usuario (nombre, avatar) |
| `categories` | Categorías personalizadas con color y nombre |
| `notes` | Notas con contenido JSON (Tiptap), carpeta y tags |
| `tasks` | Tareas con cuadrante Eisenhower, deadline y estado |
| `subtasks` | Subtareas anidadas dentro de una tarea |
| `study_sessions` | Sesiones de estudio con duración, tipo y categoría |

### `002_categories_constraints.sql` — Integridad y RLS granular (Eje 2)

Refuerza la tabla `categories` con las siguientes reglas, alineadas con las que aplica `CategoryModel` en código:

| Constraint | Tipo | Regla |
|---|---|---|
| `categories_user_name_unique` | UNIQUE | Un usuario no puede tener dos categorías con el mismo nombre |
| `categories_name_not_empty` | CHECK | `length(trim(name)) >= 2` |
| `categories_color_hex` | CHECK | El color debe coincidir con `^#[0-9a-fA-F]{6}$` |

Las políticas RLS se reemplazan por cuatro políticas granulares (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) para mayor claridad académica y control fino por operación.

Todas las tablas tienen **Row Level Security (RLS)** activado: cada usuario solo puede leer y escribir sus propios registros.

---

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo con Turbopack |
| `npm run build` | Build optimizado de producción |
| `npm start` | Servidor de producción (requiere build previo) |
| `npm run lint` | Análisis estático con ESLint |

---

## Seguridad

- **RLS en todas las tablas:** los usuarios solo acceden a sus propios datos, incluso con la clave anónima.
- **Sin secretos en el código:** todas las credenciales se leen desde variables de entorno.
- **Validación con Zod** en todos los formularios del cliente y del servidor.
- **`SUPABASE_SERVICE_ROLE_KEY`** solo se usa en Server Components y API Routes; nunca se envía al navegador.
- **Middleware de sesión** refresca el token automáticamente y protege todas las rutas de `(app)/`.

---

## Deploy

### Vercel (recomendado)

1. Conectar el repositorio en [vercel.com](https://vercel.com).
2. Agregar las tres variables de entorno en **Settings → Environment Variables**.
3. El deploy ocurre automáticamente en cada push a `main`.

### Consideraciones post-deploy

- Agregar el dominio de Vercel en Supabase: **Authentication → URL Configuration → Site URL**.
- Verificar que las políticas RLS estén activas desde el dashboard de Supabase.

---

## Limitaciones y trabajo futuro

| Limitación | Estado |
|-----------|--------|
| Modo oscuro | Planificado |
| Exportación de notas a PDF / Markdown | No implementado |
| Compartir notas entre usuarios | No implementado |
| Soporte offline / PWA | No implementado |
| Modo móvil nativo | No implementado |
