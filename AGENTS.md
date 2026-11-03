<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


<!-- BEGIN:drgarage-sdd -->

# drGarage: contexto y método de trabajo

## Antes de empezar

Lee, en este orden:

1. `.kiro/steering/product.md`, `.kiro/steering/tech.md` y `.kiro/steering/structure.md` (producto, decisiones técnicas y estructura). Si tu herramienta ya los cargó, no los repitas.
2. La spec del feature en curso: `.kiro/specs/001-seguimiento-por-enlace/` (`requirements.md`, `design.md`, `tasks.md`).
3. Para toda la interfaz, la skill `marca-drgarage` (`.kiro/skills/marca-drgarage/SKILL.md`; en Claude Code, `.claude/skills/marca-drgarage/`).

## Fuentes de verdad

- La spec del feature (`.kiro/specs/<feature>/`) es la guía principal. Si el código y la spec no coinciden, se corrige primero la spec.
- `docs/` y `design/` son material de referencia, no un encargo: consúltalos cuando una tarea los cite. `docs/especificacion.md` describe el MVP completo; no implementes lo que quede fuera del alcance del feature en curso.

## Seguimiento de tareas

- En `.kiro/specs/<feature>/tasks.md`, marca el estado de cada tarea con la convención de Kiro: `[ ]` pendiente, `[-]` en curso (márcala al empezar), `[x]` completada y verificada (solo tras pasar las pruebas), `[ ]*` opcional, `[!]` bloqueada, `[~]` cancelada o descartada (`[/]` es una sintaxis alternativa de descartada).
- Si no puedes completar una tarea sin cambiar el alcance o sin algo que debe hacer la persona, márcala `[!]` y avisa en lugar de continuar.
- Si la sesión se interrumpe, al retomar busca la primera tarea en curso, bloqueada o pendiente, revisa el estado real del código y continúa desde ahí; no repitas tareas ya marcadas `[x]`.
- No modifiques el resto del archivo (títulos, IDs, JSON de waves), para que Kiro pueda retomar la spec.
- Ejecuta las tareas en orden, una a la vez; ignora el JSON de waves salvo que la persona pida paralelismo.

<!-- END:drgarage-sdd -->
