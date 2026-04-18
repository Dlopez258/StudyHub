# Brief de Proyecto — StudyHub

**Asignatura:** Desarrollo Web
**Institución:** Fundación Universitaria del Área Andina
**Tipo:** Aplicación web full-stack

---

## 1. Resumen ejecutivo

StudyHub es una aplicación web orientada a estudiantes universitarios y autodidactas que centraliza tres herramientas críticas del flujo de estudio diario: toma de apuntes, gestión de tareas por prioridad y cronómetro de sesiones de estudio. El objetivo es reemplazar el uso disperso de múltiples apps (Notion + Todoist + Forest, por ejemplo) con una experiencia unificada, enfocada en el contexto académico.

El producto debe sentirse moderno, limpio y rápido. La paleta visual es verde (`#67b31f`) sobre fondos claros, con tipografía Roboto y componentes con bordes suaves y sombras sutiles.

---

## 2. Stack técnico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 14+ con App Router |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS (configurado con la paleta del proyecto) |
| Base de datos | Supabase (Postgres) |
| Autenticación | Supabase Auth (email + password) |
| ORM / Cliente DB | `@supabase/supabase-js` + `@supabase/ssr` |
| Editor rich text | Tiptap (extensible, buena integración con React) |
| Gráficas | Recharts |
| Drag & drop (Kanban) | dnd-kit |
| Iconos | lucide-react |
| Validación | Zod |
| Formularios | react-hook-form |
| Fechas | date-fns |

**Nota:** No usar `@supabase/auth-helpers-nextjs` (deprecado). Usar `@supabase/ssr`.

---

## 3. Paleta de colores y sistema visual

Configurar estas variables en `tailwind.config.ts` dentro de `theme.extend.colors` y como variables CSS globales en `app/globals.css`:

```css
:root {
  --color-primary:       #67b31f;
  --color-primary-dark:  #5a9e1b;
  --color-primary-light: #7cc934;
  --color-white:         #ffffff;
  --color-black:         #000000;
  --color-gray-light:    #f8f9fa;
  --color-gray-mid:      #6c757d;
  --color-gray-border:   #e2e8f0;
  --color-text:          #1a1a1a;
  --color-text-soft:     #444444;
  --shadow-card: 0 2px 16px rgba(0, 0, 0, 0.07);
  --shadow-card-hover: 0 8px 32px rgba(103, 179, 31, 0.15);
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
}
```

Tipografía: `Roboto` (cargar desde `next/font/google`).

Principios de diseño:
- Espaciado generoso (padding mínimo de 24px en cards).
- Radios suaves (8px por defecto, 16px en contenedores grandes).
- Sombras sutiles, no pronunciadas.
- Hover states con `translateY(-1px)` o `translateY(-4px)` en cards.
- Transiciones de 0.25s ease en interacciones.
- El verde primario es el color de acción (botones, links activos, acentos); nunca saturar la interfaz con él.

---

## 4. Arquitectura y estructura de carpetas

```
studyhub/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx              # Layout con sidebar + navbar
│   │   ├── dashboard/page.tsx      # Vista resumen (opcional)
│   │   ├── notes/
│   │   │   ├── page.tsx            # Lista de carpetas + búsqueda
│   │   │   └── [noteId]/page.tsx   # Editor de nota individual
│   │   ├── tasks/page.tsx          # Kanban Eisenhower
│   │   └── timer/page.tsx          # Temporizador + stats
│   ├── api/                        # Route handlers si se requieren
│   ├── layout.tsx                  # Layout raíz
│   ├── page.tsx                    # Landing pública
│   └── globals.css
├── components/
│   ├── ui/                         # Botones, inputs, modales base
│   ├── notes/
│   ├── tasks/
│   ├── timer/
│   └── shared/                     # Navbar, sidebar, etc.
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Cliente para Client Components
│   │   ├── server.ts               # Cliente para Server Components
│   │   └── middleware.ts           # Refresh de sesión
│   ├── utils.ts
│   └── types.ts                    # Tipos TypeScript compartidos
├── hooks/
├── middleware.ts                   # Protección de rutas
├── public/
└── supabase/
    └── migrations/                 # SQL de migraciones
```

---

## 5. Modelo de datos (Supabase)

Todas las tablas deben tener RLS (Row Level Security) activado. Las políticas deben permitir a cada usuario acceder únicamente a sus propios registros (`auth.uid() = user_id`).

### Tabla `profiles`
Se crea automáticamente vía trigger cuando un usuario se registra en `auth.users`.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid (PK) | FK a `auth.users.id` |
| full_name | text | |
| avatar_url | text | nullable |
| created_at | timestamptz | default now() |

### Tabla `folders` (para notas)
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| name | text | ej: "Cálculo II", "Inglés B2", "Platzi React" |
| color | text | hex opcional, para personalización |
| created_at | timestamptz | |

### Tabla `notes`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| folder_id | uuid (FK, nullable) | nota sin carpeta = "Inbox" |
| title | text | |
| content | jsonb | JSON de Tiptap |
| content_text | text | versión plana para búsqueda full-text |
| tags | text[] | array de tags |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Índice full-text: `CREATE INDEX notes_search_idx ON notes USING gin(to_tsvector('spanish', title || ' ' || content_text));`

### Tabla `tasks`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| title | text | |
| description | text | nullable |
| quadrant | text | enum: `urgent_important`, `not_urgent_important`, `urgent_not_important`, `not_urgent_not_important` |
| deadline | timestamptz | nullable |
| category_id | uuid (FK) | nullable, FK a `categories` |
| completed | boolean | default false |
| position | integer | orden dentro del cuadrante (para drag & drop) |
| created_at | timestamptz | |
| completed_at | timestamptz | nullable |

### Tabla `subtasks`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid (PK) | |
| task_id | uuid (FK) | |
| title | text | |
| completed | boolean | default false |
| position | integer | |

### Tabla `categories` (materias/áreas compartidas por tareas y sesiones de estudio)
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| name | text | ej: "Matemáticas", "Programación" |
| color | text | hex |
| created_at | timestamptz | |

### Tabla `study_sessions`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| category_id | uuid (FK, nullable) | |
| duration_minutes | integer | 10–120 |
| actual_duration_seconds | integer | tiempo real transcurrido |
| mode | text | enum: `simple`, `pomodoro` |
| pomodoro_cycles_completed | integer | default 0 |
| started_at | timestamptz | |
| completed_at | timestamptz | nullable — null si se abandonó |
| notes | text | nullable |

---

## 6. Funcionalidades detalladas

### 6.1 Autenticación

- Páginas `/login` y `/register` con formularios validados (Zod + react-hook-form).
- Registro: email, contraseña, nombre completo.
- Login: email, contraseña.
- Middleware en `middleware.ts` que protege todas las rutas bajo `(app)` y redirige a `/login` si no hay sesión.
- Logout desde el menú de usuario en el navbar.
- Recuperación de contraseña vía email (opcional pero recomendado).

### 6.2 Módulo de Notas

**Ruta:** `/notes`

**Vista principal (sidebar de 2 niveles + contenido):**
- Sidebar izquierdo muestra lista de carpetas del usuario con contador de notas.
- Botón "+ Nueva carpeta" en la parte superior del sidebar.
- Barra de búsqueda global (busca en título y contenido de todas las notas).
- Filtro por tags (chips seleccionables).
- Al seleccionar una carpeta, se muestran las notas dentro en formato de lista con preview (título + primeras 2 líneas + fecha de actualización).
- Botón "+ Nueva nota" dentro de cada carpeta.

**Vista de nota individual:** `/notes/[noteId]`
- Editor Tiptap con las siguientes extensiones:
  - StarterKit (párrafos, bold, italic, listas, blockquote)
  - Heading (h1, h2, h3)
  - CodeBlockLowlight (resaltado de sintaxis)
  - Image (subida a Supabase Storage, bucket `notes-images`)
  - Link
  - TaskList + TaskItem (checkboxes)
  - Placeholder
- Toolbar flotante o fija con los botones de formato.
- Campo de título editable grande arriba del editor.
- Selector de carpeta y campo de tags (input con chips) en una barra superior.
- Autoguardado con debounce de 1 segundo (actualizar `updated_at` y `content_text`).
- Indicador visual de "Guardado" / "Guardando...".
- Botón de eliminar con confirmación modal.

**Búsqueda:**
- Input en el header que hace query full-text en español contra `notes.content_text` y `notes.title`.
- Resultados en dropdown con highlight del término encontrado.

### 6.3 Módulo de Tareas (Matriz de Eisenhower)

**Ruta:** `/tasks`

**Vista Kanban con 4 columnas:**

| Columna | Etiqueta visible | Color de acento |
|---------|------------------|-----------------|
| `urgent_important` | Hacer ahora (Urgente e Importante) | rojo suave |
| `not_urgent_important` | Planificar (Importante, no urgente) | verde primario |
| `urgent_not_important` | Delegar (Urgente, no importante) | amarillo |
| `not_urgent_not_important` | Eliminar (Ni urgente ni importante) | gris |

Arriba de cada columna: título + contador de tareas + botón "+" para agregar tarea rápida.

**Tarjeta de tarea:**
- Checkbox de completado.
- Título (editable inline o al abrir modal).
- Badge de categoría (con color).
- Fecha límite (si existe) — resaltada en rojo si está vencida, amarillo si vence hoy.
- Contador de subtareas completadas (`3/5`).
- Al hacer click: se abre modal de detalle.

**Modal de detalle de tarea:**
- Título editable.
- Descripción (textarea).
- Selector de cuadrante (4 radio buttons con colores).
- Date picker para deadline.
- Selector de categoría (dropdown con opción de crear nueva inline).
- Lista de subtareas con checkbox + botón "+ Agregar subtarea".
- Botón eliminar con confirmación.

**Drag & drop (dnd-kit):**
- Arrastrar tarjetas entre columnas actualiza el campo `quadrant`.
- Reordenar dentro de la misma columna actualiza `position`.
- Las mutaciones deben ser optimistas (actualizar UI primero, luego Supabase).

**Filtros:**
- Filtro por categoría.
- Toggle "Mostrar completadas" (por defecto ocultas).

### 6.4 Módulo de Temporizador de estudio

**Ruta:** `/timer`

**Vista principal dividida en dos zonas:**

**Zona 1 — Temporizador (arriba):**
- Display circular grande con el tiempo restante (SVG animado).
- Slider o input numérico para elegir duración: rango 10–120 minutos, pasos de 5.
- Selector de categoría (dropdown con categorías del usuario + "Sin categoría").
- Toggle modo: `Simple` / `Pomodoro`.
  - Modo simple: un solo bloque del tiempo elegido.
  - Modo Pomodoro: ciclos de 25 min estudio + 5 min descanso, más descanso largo de 15 min cada 4 ciclos. El total de minutos elegido define cuántos ciclos aproximados se correrán.
- Botones: `Iniciar`, `Pausar`, `Reanudar`, `Detener`.
- Al completar la sesión: notificación sonora (archivo `.mp3` en `/public/sounds/bell.mp3`) + notificación del navegador (Web Notifications API, pedir permiso la primera vez).
- El temporizador debe seguir funcionando aunque el tab esté en background (usar `setInterval` con cálculo por timestamps, no contadores).
- Persistir el estado en localStorage para sobrevivir a un refresh accidental.

**Zona 2 — Historial y estadísticas (abajo):**
- Tabs: `Historial` / `Estadísticas`.

*Historial:*
- Tabla/lista de sesiones completadas: fecha, hora, duración, categoría, modo.
- Filtro por rango de fechas y categoría.
- Paginación o scroll infinito.

*Estadísticas (Recharts):*
- **Gráfico de barras:** minutos estudiados por día en los últimos 7 / 30 días.
- **Gráfico de torta:** distribución de tiempo por categoría.
- **Tarjetas de resumen:**
  - Total de horas esta semana.
  - Racha actual (días consecutivos con al menos una sesión).
  - Categoría más estudiada del mes.
  - Promedio diario.

### 6.5 Gestión de categorías

Página o modal accesible desde el timer y el módulo de tareas. CRUD simple: listar, crear, renombrar, cambiar color, eliminar (con confirmación si hay tareas o sesiones asociadas).

---

## 7. Componentes compartidos (UI)

Construir una librería mínima de componentes reutilizables en `components/ui/`:

- `Button` (variantes: primary, outline, ghost, danger; tamaños: sm, md, lg)
- `Input`, `Textarea`, `Select`
- `Modal` / `Dialog`
- `Tooltip`
- `Toast` (usar `sonner` o `react-hot-toast`)
- `Card`
- `Badge`
- `Spinner` / skeleton loaders
- `ConfirmDialog`
- `DatePicker`
- `TagInput`
- `ColorPicker` (para categorías y carpetas)

---

## 8. Layout general

**Navbar superior (fijo, altura 68px):**
- Logo "StudyHub" a la izquierda.
- Links de navegación: `Notas`, `Tareas`, `Temporizador`.
- Buscador global a la derecha (opcional).
- Avatar del usuario con dropdown: perfil, categorías, cerrar sesión.

**Sidebar contextual (solo en `/notes`):**
- Lista de carpetas.
- Solo aparece en el módulo de notas; los otros módulos usan el ancho completo.

**Responsive:**
- Mobile: navbar colapsa en hamburger menu. Kanban se convierte en tabs horizontales. Sidebar de notas se transforma en drawer deslizable.
- Tablet: layouts a 2 columnas cuando aplique.
- Desktop: experiencia completa.

---

## 9. Entregables académicos

La asignatura requiere, además del código funcional:

1. **README.md** en el repositorio con:
   - Descripción del proyecto y objetivos.
   - Stack técnico justificado.
   - Instrucciones de instalación y configuración (variables de entorno, setup de Supabase).
   - Scripts disponibles (`dev`, `build`, `lint`).
   - Screenshots de cada módulo.
   - Autor(es), asignatura, profesor, fecha.

2. **Documento técnico (informe)** en `/docs/informe.md`:
   - Problema que resuelve la aplicación.
   - Arquitectura (diagrama de componentes y de datos).
   - Decisiones de diseño (por qué Next.js, por qué Supabase, etc.).
   - Modelo entidad-relación con diagrama.
   - Capturas de cada pantalla con explicación.
   - Limitaciones y trabajo futuro.

3. **Video demo** (3–5 minutos) mostrando:
   - Registro e inicio de sesión.
   - Creación de una nota con imagen y formato.
   - Creación y movimiento de tareas en el Kanban.
   - Una sesión de temporizador (acelerada si es muy larga).
   - Vista de estadísticas.
   - Guardar en `/docs/demo.mp4` o subir a YouTube y enlazar en el README.

4. **Repositorio en GitHub** público con commits descriptivos, idealmente con convención tipo `feat:`, `fix:`, `docs:`.

5. **Deploy en Vercel** (Next.js es gratuito en Vercel). Incluir el link en el README.

---

## 10. Plan de trabajo por fases

Estimación sugerida para que Claude Code trabaje de forma incremental. Cada fase termina con algo funcional y testeable.

### Fase 0 — Setup (1 sesión)
- `create-next-app` con TypeScript, Tailwind, App Router.
- Configurar paleta en `tailwind.config.ts` y variables CSS en `globals.css`.
- Instalar dependencias principales.
- Crear proyecto en Supabase, correr migraciones iniciales, configurar RLS.
- Configurar clientes de Supabase (client, server, middleware).
- Variables de entorno (`.env.local` + `.env.example`).

### Fase 1 — Autenticación y layout (1 sesión)
- Páginas `/login` y `/register`.
- Middleware de protección de rutas.
- Layout general con navbar y menú de usuario.
- Landing pública en `/`.

### Fase 2 — Categorías (1 sesión)
- CRUD de categorías (se necesitan para tareas y timer).
- Componente reutilizable de selector de categoría.

### Fase 3 — Módulo de Tareas (2 sesiones)
- CRUD de tareas y subtareas.
- Vista Kanban con dnd-kit.
- Modal de detalle.
- Filtros y completado.

### Fase 4 — Módulo de Temporizador (2 sesiones)
- Componente de temporizador con modo simple y Pomodoro.
- Persistencia en DB al completar/abandonar.
- Historial de sesiones.
- Gráficas con Recharts.
- Notificaciones sonoras y del navegador.

### Fase 5 — Módulo de Notas (2–3 sesiones)
- CRUD de carpetas.
- Integración de Tiptap con todas las extensiones.
- Subida de imágenes a Supabase Storage.
- Autoguardado con debounce.
- Búsqueda full-text y filtro por tags.

### Fase 6 — Pulido y entregables (1–2 sesiones)
- Responsive completo.
- Estados de carga y error en todas las pantallas.
- Toasts de feedback.
- README, informe técnico, screenshots.
- Deploy en Vercel.
- Grabación de video demo.

**Total estimado: 10–12 sesiones de trabajo.**

---

## 11. Criterios de calidad

- **TypeScript estricto:** sin `any` salvo casos muy justificados.
- **Server Components por defecto;** Client Components solo cuando hay interactividad.
- **Validación con Zod** en todo input de formulario y en route handlers.
- **Accesibilidad:** labels en todos los inputs, roles ARIA donde aplique, contraste AA mínimo, navegación por teclado.
- **Estados de carga y error** explícitos en cada fetch.
- **Optimistic updates** en interacciones críticas (drag & drop, toggle de completado).
- **Sin secretos en el código:** todo en variables de entorno.
- **RLS activado** en todas las tablas antes de cualquier deploy.

---

## 12. Variables de entorno

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # solo para scripts de admin, no exponer al cliente
```

---

## 13. Preguntas abiertas para validar durante el desarrollo

- ¿Se requiere compartir notas o tareas con otros usuarios? (Asumido: no, es individual.)
- ¿Se necesita exportar notas a PDF o Markdown? (Asumido: no, queda como feature futura.)
- ¿Idioma de la interfaz? (Asumido: español.)
- ¿Modo oscuro? (No pedido, queda como feature futura.)
