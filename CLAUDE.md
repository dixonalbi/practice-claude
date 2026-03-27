# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup          # Install deps + generate Prisma client + run migrations
npm run dev            # Dev server with Turbopack (localhost:3000)
npm run dev:daemon     # Dev server in background (logs to logs.txt)
npm run build          # Production build
npm run lint           # ESLint
npm test               # Vitest (watch mode)
npx vitest run         # Run tests once
npx vitest run src/components/chat  # Run tests in a directory
npm run db:reset       # Reset database
npx prisma generate    # Regenerate Prisma client after schema changes
npx prisma migrate dev # Create/apply migrations after schema changes
```

All dev/build/start commands require `NODE_OPTIONS='--require ./node-compat.cjs'` (already configured in package.json scripts).

## Architecture

**UIGen** is an AI-powered React component generator. Users describe components via chat, an LLM generates code using tools, and the result renders in a live preview — all without writing files to disk.

### Core Flow

1. **Chat** (`src/lib/contexts/chat-context.tsx`) — Uses Vercel AI SDK's `useChat` to stream messages to `/api/chat`
2. **API Route** (`src/app/api/chat/route.ts`) — Receives messages + serialized virtual filesystem, calls Claude via `streamText` with two tools: `str_replace_editor` and `file_manager`
3. **Virtual Filesystem** (`src/lib/file-system.ts`) — `VirtualFileSystem` class manages an in-memory file tree (Map-based). The AI creates/edits files here. Serialized as JSON for persistence.
4. **Tool Execution** — Tools run server-side against the VFS. Tool calls are also replayed client-side via `FileSystemProvider.handleToolCall` to keep the UI in sync.
5. **Live Preview** (`src/components/preview/PreviewFrame.tsx`) — Transforms JSX files with `@babel/standalone`, creates blob URLs, builds an import map, and renders in a sandboxed iframe. Third-party imports resolve via `esm.sh`.

### AI Provider

- With `ANTHROPIC_API_KEY` in `.env`: uses Claude Haiku 4.5 via `@ai-sdk/anthropic`
- Without API key: uses `MockLanguageModel` (`src/lib/provider.ts`) that returns static component code

### Key Contexts

- `FileSystemProvider` — Wraps VFS, manages selected file state, handles tool call side effects
- `ChatProvider` — Wraps Vercel AI SDK's `useChat`, passes serialized files with each request

### Auth

- JWT sessions via `jose` with HTTP-only cookies (`src/lib/auth.ts`)
- Server Actions for sign up/sign in/sign out (`src/actions/index.ts`)
- Middleware protects `/api/projects` and `/api/filesystem` routes
- Anonymous users can use the app without auth; authenticated users get project persistence

### Database

- SQLite via Prisma (`prisma/schema.prisma`)
- Prisma client outputs to `src/generated/prisma`
- Two models: `User` and `Project`. Projects store messages and VFS data as JSON strings.

### AI Tools (given to the LLM)

- `str_replace_editor` — view, create, str_replace, insert operations on VFS files
- `file_manager` — rename and delete files/directories

### Preview Pipeline (`src/lib/transform/jsx-transformer.ts`)

- Babel transforms JSX/TSX to JS
- Creates import map: local files → blob URLs, third-party packages → `esm.sh`
- `@/` import alias maps to VFS root
- CSS imports are extracted and injected as `<style>` tags
- Missing imports get placeholder modules

## Conventions

- Path alias: `@/*` → `./src/*`
- UI components: shadcn/ui (new-york style) in `src/components/ui/`
- Styling: Tailwind CSS v4 with CSS variables for theming
- Tests: Vitest + jsdom + React Testing Library, colocated in `__tests__/` directories
- Server Actions in `src/actions/`
- The LLM's generated components use `/App.jsx` as the entry point in the VFS
- Use comments sparingly — only comment complex code
