# My AI — Agent Guidelines & Project Instructions

Welcome to **My AI**, an AI assistant platform designed for high performance, deep reasoning, and an effortless user experience.

---

## 🎯 Product Vision

Build an AI assistant that combines:
- **Fast responses**: Low-latency interactions and real-time feedback.
- **Strong reasoning**: Deep problem-solving and structured analysis.
- **Web research**: Accurate, up-to-date information gathering.
- **Document understanding**: Seamless analysis and querying across user documents.
- **Image understanding**: Multimodal vision capabilities.
- **Memory**: Context retention across interactions.
- **Tool use**: Extensible function calling and external integrations.
- **Extremely simple UX**: Intuitive, clutter-free, and delightful user interface.

---

## 📐 Engineering Principles

1. **Production-quality TypeScript**: Write clean, strongly typed, maintainable TypeScript across the stack.
2. **Modular architecture**: Organize the codebase into decoupled, well-bounded modules and services.
3. **Provider-independent AI layer**: Abstract LLM and AI service integrations to prevent vendor lock-in.
4. **Never expose API keys to the browser**: All client-facing interfaces must remain secure without leaking secrets.
5. **Server-side secrets only**: Manage credentials, tokens, and private configurations strictly on the server.
6. **Strong input validation**: Validate and sanitize all inputs at system boundaries (schemas, APIs, forms).
7. **Proper error handling**: Gracefully handle errors with meaningful feedback, logging, and recovery paths.
8. **Streaming responses where possible**: Default to streaming text and events to provide instant feedback.
9. **Test important functionality**: Write tests covering core logic, state transitions, and critical workflows.
10. **Avoid unnecessary dependencies**: Keep the dependency footprint minimal, lightweight, and auditable.
11. **Avoid duplicated business logic**: Consolidate common rules, computations, and abstractions in shared modules.
12. **Keep components small and reusable**: Favor single-responsibility, composable UI components and functions.
13. **Use environment variables for configuration**: Manage runtime configs, secrets, and environment profiles via `.env`.
14. **Use database migrations**: Keep schema changes versioned, reproducible, and tracked via migrations.
15. **Never silently change architecture without explaining why**: Document and communicate architectural shifts.
16. **Never delete existing functionality unless explicitly requested**: Preserve working features and APIs.
17. **Before implementing a major feature, inspect the existing codebase**: Review existing patterns and dependencies first.
18. **After implementation, run tests and type checking**: Ensure everything compiles cleanly and all tests pass.
19. **For UI changes, run the application and visually verify the result**: Confirm layout, responsiveness, and visual polish.
20. **Prefer simple solutions over unnecessary abstractions**: Avoid premature over-engineering; choose simplicity and clarity.

---

## 🔄 Development Workflow

Follow this standard lifecycle for every feature, bug fix, or modification:

1. **Inspect**: Examine the relevant files, patterns, and current behavior.
2. **Plan**: Outline the technical approach and identify affected components.
3. **Implement**: Execute clean, focused code changes following project conventions.
4. **Test**: Run unit/integration tests and type checks (`tsc`) to catch regressions.
5. **Verify**: Run the application or test environment to validate behavior and visual output.
6. **Report**: Summarize what was changed, verified, and any relevant context.

---

## 🧭 Ambiguity & Scope Control

- **Handling Ambiguity**: When a task is underspecified or ambiguous, make the safest reasonable assumption and clearly explain the rationale.
- **Milestone Discipline**: Do not build future features prematurely. Implement only the requested milestone.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
