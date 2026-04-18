# StudyHub

Aplicación web full-stack para estudiantes universitarios que centraliza notas, gestión de tareas y temporizador de estudio en una sola experiencia.

**Asignatura:** Desarrollo Web  
**Institución:** Fundación Universitaria del Área Andina  
**Autor:** [Tu nombre]  
**Fecha:** Abril 2026

---

## Stack técnico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Framework | Next.js 16 + App Router | SSR, Server Components, routing nativo |
| Lenguaje | TypeScript | Seguridad de tipos, mantenibilidad |
| Estilos | Tailwind CSS v4 | Utilidades atómicas, sin CSS extra |
| Base de datos | Supabase (Postgres) | BaaS completo, RLS nativo, Storage |
| Autenticación | Supabase Auth | Integrado con DB, seguro por defecto |
| Editor rich text | Tiptap 3 | Extensible, basado en ProseMirror |
| Gráficas | Recharts | Declarativo, compatible con React 19 |
| Drag & drop | dnd-kit | Accesible, optimizado para web |
| Validación | Zod v4 | Type-safe, integración con react-hook-form |
| Formularios | react-hook-form | Performante, sin re-renders innecesarios |
| Fechas | date-fns | Modular, tree-shakeable |
| Toasts | Sonner | Minimalista, accesible |

---

## Instalación y configuración

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url>
cd studyhub
npm install
```

### 2. Configurar Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a **SQL Editor** y ejecutar el contenido de `supabase/migrations/001_initial.sql`
3. Copiar las credenciales desde **Settings → API**

### 3. Variables de entorno

```bash
cp .env.example .env.local
```

Editar `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo (Turbopack) |
| `npm run build` | Build de producción |
| `npm start` | Servidor de producción |
| `npm run lint` | Linter ESLint |

---

## Estructura del proyecto

```
studyhub/
├── app/
│   ├── (auth)/login/          # Página de login
│   ├── (auth)/register/       # Página de registro
│   ├── (app)/dashboard/       # Dashboard con resumen
│   ├── (app)/notes/           # Módulo de notas
│   ├── (app)/notes/[noteId]/  # Editor de nota individual
│   ├── (app)/tasks/           # Kanban Eisenhower
│   ├── (app)/timer/           # Temporizador + estadísticas
│   ├── (app)/categories/      # CRUD de categorías
│   └── (app)/profile/         # Perfil de usuario
├── components/
│   ├── notes/                 # NoteEditor, NotesClient
│   ├── tasks/                 # KanbanColumn, TaskCard, TaskModal, TasksClient
│   ├── timer/                 # TimerClient, SessionHistory, StudyStats
│   └── shared/                # Navbar, CategoriesClient, ProfileClient
├── lib/
│   ├── supabase/              # Clientes (client, server, middleware)
│   ├── types.ts               # Tipos TypeScript compartidos
│   └── utils.ts               # Utilidades (cn, formatDate, etc.)
├── supabase/migrations/       # SQL de migraciones
└── public/sounds/             # bell.mp3 (sonido de temporizador)
```

---

## Módulos

### Notas
- Editor Tiptap con formato completo (bold, italic, headings, código, blockquote, checklists, imágenes)
- Organización en carpetas con contador de notas
- Sistema de tags con filtro por chip
- Autoguardado con debounce de 1 segundo
- Subida de imágenes a Supabase Storage

### Tareas (Matriz de Eisenhower)
- Vista Kanban con 4 cuadrantes: Hacer ahora / Planificar / Delegar / Eliminar
- Drag & drop entre columnas (dnd-kit)
- Modal de detalle con subtareas, deadline y categorías
- Filtro por categoría, toggle de completadas
- Actualizaciones optimistas

### Temporizador
- Modo Simple (10–120 min con slider) y Pomodoro (25/5/15 min)
- Display circular SVG animado
- Persiste estado en localStorage para sobrevivir refreshes
- Guarda sesiones en Supabase al completar/detener
- Notificaciones sonoras + Web Notifications API
- Historial de sesiones y estadísticas (gráfico de barras diario + torta por categoría)

---

## Seguridad

- RLS activado en todas las tablas (usuarios solo ven sus propios datos)
- Sin secretos en el código fuente (todo en variables de entorno)
- Validación con Zod en todos los formularios
- `SUPABASE_SERVICE_ROLE_KEY` nunca expuesto al cliente

---

## Deploy en Vercel

1. Conectar el repositorio en [vercel.com](https://vercel.com)
2. Agregar las variables de entorno en el dashboard de Vercel
3. Deploy automático en cada push a `main`

---

## Limitaciones y trabajo futuro

- Sin modo oscuro (planificado)
- Sin exportación de notas a PDF/Markdown
- Sin compartir notas entre usuarios
- Sin sincronización offline (PWA)
