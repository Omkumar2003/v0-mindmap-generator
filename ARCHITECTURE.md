# MindMap Pro - Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER BROWSER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────────┐   │
│  │  Home Page        │  │  Contact Page     │  │  Authentication Pages │   │
│  │  /                │  │  /contact         │  │  /auth/sign-up        │   │
│  │  /auth/login      │  │  - Contact Form   │  │  /auth/login          │   │
│  │  - Features       │  │  - Validation     │  │  - Email/Password     │   │
│  │  - CTAs           │  │  - Success Msg    │  │  - Form Validation    │   │
│  └───────────────────┘  └───────────────────┘  └───────────────────────┘   │
│           │                      │                        │                   │
│           └──────────────────────┴────────────────────────┘                   │
│                                  │                                             │
│                     ┌────────────────────────┐                                │
│                     │   Header Navigation    │                                │
│                     │ - Theme Toggle         │                                │
│                     │ - Dynamic Nav Items    │                                │
│                     │ - Logo/Home Link       │                                │
│                     └────────────────────────┘                                │
│                                  │                                             │
│  ┌───────────────────────────────┴────────────────────────────────────────┐  │
│  │  Protected Pages (Requires Auth)                                        │  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │                                                                         │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────┐  │  │
│  │  │ Dashboard    │  │ Editor       │  │ Mind Map Viewer            │  │  │
│  │  │ /dashboard   │  │ /editor/[id] │  │ /mindmap/[id]              │  │  │
│  │  │              │  │              │  │                            │  │  │
│  │  │ - List Docs  │  │ - Edit Text  │  │ - Interactive Visualization│  │  │
│  │  │ - Create Doc │  │ - Save       │  │ - Drag Nodes              │  │  │
│  │  │ - Delete Doc │  │ - Generate   │  │ - Edit Labels             │  │  │
│  │  │ - Navigate   │  │   Mind Map   │  │ - View Summary Panel      │  │  │
│  │  │   to Editor  │  │              │  │ - Zoom/Pan Controls       │  │  │
│  │  └──────────────┘  └──────────────┘  └────────────────────────────┘  │  │
│  │         │                  │                     │                     │  │
│  └─────────┼──────────────────┼─────────────────────┼─────────────────────┘  │
│            │                  │                     │                         │
│            └──────────────────┴─────────────────────┘                         │
│                               │                                               │
└───────────────────────────────┼───────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
              ┌─────────────┐         ┌─────────────┐
              │  API Layer  │         │  Middleware │
              │             │         │             │
              │ - /api/*    │         │ - Auth Check│
              │ - Auth      │         │ - Route     │
              │ - Queries   │         │   Protection│
              │ - Mutations │         │ - Session   │
              └─────────────┘         │   Mgmt      │
                    │                 └─────────────┘
                    │                       │
        ┌───────────┴───────────────────────┴───────────┐
        │                                               │
   ┌─────────────────────────────────────────────────────────┐
   │              NEXT.JS 16 SERVER                          │
   ├─────────────────────────────────────────────────────────┤
   │                                                          │
   │  ┌────────────────────────────────────────────────┐    │
   │  │  API Routes (Protected)                        │    │
   │  ├────────────────────────────────────────────────┤    │
   │  │ GET  /api/documents                 Auth Required   │
   │  │ GET  /api/documents/[id]            Auth Required   │
   │  │ PUT  /api/documents/[id]            Auth Required   │
   │  │ POST /api/generate-mindmap          Auth Required   │
   │  │ GET  /api/mindmaps/[id]             Auth Required   │
   │  └────────────────────────────────────────────────┘    │
   │                     │                                    │
   │  ┌──────────────────┴──────────────────┐                │
   │  │     Business Logic Layer             │                │
   │  ├──────────────────────────────────────┤                │
   │  │ - User Authentication                │                │
   │  │ - Document Operations                │                │
   │  │ - Mind Map Generation                │                │
   │  │ - Groq AI Integration                │                │
   │  │ - Data Validation                    │                │
   │  └──────────────────┬──────────────────┘                │
   │                     │                                    │
   └─────────────────────┼────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
   ┌─────────────────────┐        ┌──────────────────┐
   │   Supabase          │        │   Groq API       │
   │   (PostgreSQL)      │        │   (AI/LLM)       │
   ├─────────────────────┤        ├──────────────────┤
   │                     │        │                  │
   │ Auth Service        │        │ - Model: mixtral │
   │ ├─ Sign up          │        │ - Fast inference │
   │ ├─ Login            │        │ - Streaming      │
   │ ├─ Email Verify     │        │ - JSON responses │
   │ └─ Sessions         │        │                  │
   │                     │        │ API Endpoint:    │
   │ Database Tables     │        │ /v1/messages     │
   │ ├─ profiles         │        │                  │
   │ ├─ documents        │        │ Environment:     │
   │ ├─ mindmaps         │        │ GROQ_API_KEY     │
   │ └─ summaries        │        │                  │
   │                     │        └──────────────────┘
   │ RLS Policies        │
   │ ├─ profiles: Own    │
   │ ├─ documents: Own   │
   │ ├─ mindmaps: Own    │
   │ └─ summaries: Own   │
   │                     │
   │ Triggers/Functions  │
   │ └─ Auto-create      │
   │    profile on       │
   │    user signup      │
   │                     │
   └─────────────────────┘
```

## Data Flow Diagram

```
User Sign Up Flow:
─────────────────

Browser (Sign Up Form)
       │
       ├─> POST /auth/sign-up
       │
       ├─> Supabase Auth
       │   ├─ Email verification
       │   └─ Trigger: create profile
       │
       ├─ Email Sent
       │
       ├─ Click Email Link
       │
       ├─> Auth Callback Route
       │
       └─> Redirect /auth/sign-up-success


User Document to Mind Map Flow:
───────────────────────────────

Dashboard
    │
    ├─> Create Document
    │   └─> POST /api/documents (save to DB)
    │
    ├─> Navigate to Editor
    │   └─> GET /api/documents/[id]
    │
    ├─> Click "Generate Mind Map"
    │   │
    │   └─> POST /api/generate-mindmap
    │       ├─> Extract content
    │       ├─> Send to Groq API
    │       ├─ Groq processes with AI
    │       ├─ Returns concepts & structure
    │       ├─> Save to DB as mindmap
    │       ├─> Save summary
    │       └─> Redirect to /mindmap/[id]
    │
    ├─> Mind Map Viewer
    │   ├─ GET /api/mindmaps/[id]
    │   ├─ React Flow renders visualization
    │   ├─ Interactive features enabled
    │   └─ Summary panel displays
    │
    └─> Edit & Save
        └─> PUT /api/mindmaps/[id]
            └─> Update DB
```

## Component Hierarchy

```
RootLayout
├── ThemeProvider
│   └── HTML/Body
│       ├── Header
│       │   ├── Logo
│       │   ├── Navigation (Dynamic)
│       │   └── ThemeToggle
│       │
│       └── Page Content
│           ├── Public Pages
│           │   ├── Home
│           │   ├── Contact
│           │   └── Auth Pages
│           │
│           └── Protected Pages
│               ├── Dashboard
│               │   └── DocumentList
│               │       └── CreateDocumentModal
│               │
│               ├── Editor
│               │   └── (Document editing)
│               │
│               └── Mind Map Viewer
│                   ├── MindMapEditor
│                   │   └── MindMapNode (x many)
│                   └── SummaryPanel
```

## State Management

```
Client-Side:
─────────────
├── useRouter - Navigation
├── useState - Local component state
├── useEffect - Async operations
└── User Auth - Stored in Supabase session

Server-Side:
────────────
├── Middleware - Auth verification
├── API Routes - Business logic
└── Database - Persistent storage

Theme State:
────────────
└── localStorage (key: "theme")
    ├── Persists user preference
    └── Syncs across tabs
```

## Security Layers

```
1. Network Layer
   └─ HTTPS (in production)

2. Authentication Layer
   ├─ Email/Password verification
   ├─ Email confirmation required
   └─ Session tokens

3. API Layer
   ├─ Auth middleware
   ├─ Request validation
   └─ Rate limiting (optional)

4. Database Layer
   ├─ Row Level Security (RLS)
   ├─ User ID validation
   └─ Encrypted sensitive data

5. Frontend Layer
   ├─ Protected route middleware
   ├─ Protected page components
   └─ Redirect unauthorized access
```

## Deployment Architecture (Recommended)

```
┌──────────────────────────────────────────────────────┐
│           Vercel (Recommended)                       │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │  Next.js Application (Edge Network)         │   │
│  │  - Automatic deployments                    │   │
│  │  - Global CDN                               │   │
│  │  - Serverless functions                     │   │
│  │  - Environment variables                    │   │
│  └─────────────────────────────────────────────┘   │
│           │                                          │
│           ├─ Database: Supabase Cloud              │
│           ├─ AI API: Groq (External)              │
│           └─ Storage: Vercel Blob (optional)      │
│                                                       │
└──────────────────────────────────────────────────────┘
```

## File Structure

```
app/
├── layout.tsx              - Root layout with ThemeProvider
├── page.tsx                - Home page
├── globals.css             - Tailwind + theme tokens
├── auth/
│   ├── callback/           - Email verification
│   ├── login/              - Login page
│   ├── sign-up/            - Sign up page
│   ├── sign-up-success/    - Success message (NEW)
│   └── error/              - Error page
├── contact/                - Contact us page (NEW)
├── dashboard/              - Protected dashboard
├── editor/[id]/            - Document editor
├── mindmap/[id]/           - Mind map viewer
└── api/
    ├── documents/          - Document CRUD
    ├── generate-mindmap/   - AI generation
    └── mindmaps/[id]/      - Mind map retrieval

components/
├── Header.tsx              - Navigation header
├── ThemeProvider.tsx       - Theme system (NEW)
├── ThemeToggle.tsx         - Theme toggle button (NEW)
├── DocumentList.tsx        - Document listing
├── CreateDocumentModal.tsx - Create form
├── MindMapEditor.tsx       - React Flow container
├── MindMapNode.tsx         - Custom node component
└── SummaryPanel.tsx        - Summary display

lib/
└── supabase/
    ├── client.ts           - Browser client
    ├── server.ts           - Server client
    └── proxy.ts            - Session handling

middleware.ts              - Route protection
```

## Performance Optimizations

1. **Code Splitting** - Page-level code splitting
2. **Image Optimization** - Next.js Image component
3. **CSS Optimization** - Tailwind CSS purging
4. **API Caching** - Server-side caching
5. **React Optimization** - Memoization where needed
6. **Lazy Loading** - Component lazy loading
7. **Bundle Size** - Minimal dependencies

## Scalability Considerations

- **Database**: Supabase auto-scales PostgreSQL
- **API**: Serverless functions auto-scale
- **Storage**: Can add Vercel Blob for files
- **AI**: Groq handles load distribution
- **CDN**: Global edge network via Vercel

---

This architecture provides a scalable, secure, and maintainable solution for mind mapping with AI integration.
