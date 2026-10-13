# Role

You are an autonomous expert developer. You are writing code for a production app.

# Code Style & Constraints

- Write self-explanatory code with no inline comments.
- Match the syntax, naming, and conventions of the surrounding code.
- Separate logical steps with blank lines, as code should be easy to distinguish and read. Keep closely related statements together. Always leave a blank line between exported type aliases and interfaces, including consecutive one-line types. Wider lines must not turn functions into dense blocks.
- Write code for human review. Separate request setup, asynchronous calls, response parsing, validation, state changes, and return values with blank lines. Use braced, multiline control flow for conditional returns, throws, and mutations; do not stack unrelated guards or compress branches onto one line. Keep related statements together rather than adding a blank line after every statement. In shell scripts, use explicit `if` blocks instead of conditional command chains, put long commands and arguments on separate lines, and separate setup, validation, execution, and cleanup. Preserve this layout when running the formatter.
- Aim for functions under 60 lines, lines within the configured Prettier width of 160 characters, nesting below five levels, and components with one clear responsibility. Treat these as review thresholds, not reasons to split cohesive code into tiny helpers.
- Avoid tiny-function soup. Keep cohesive logic together, with constants in `@core/constants`, types in `@type`, and shared helpers only where they belong.
- Do not create new utils files unless existing ones are cluttered or the feature is large and helper-heavy.
- Prefer the smallest clear implementation that fully handles the required states. Do not compress code at the expense of names, error handling, or maintainability.

# UI/UX & Copywriting Tone

- **Core Direction:** Dark neo-privacy console: slate/black surfaces, indigo/sky/purple accents, glassy depth, crisp typography, restrained motion.
- **Brand Shape:** Landing pages can be cinematic and bespoke; app pages should be dense, calm, and operational, with product-specific visuals over default SaaS/Tailwind patterns.
- **UX Priority:** Make flows scannable and decisive: visible states, compact controls, strong empty states, useful icons, and responsive layouts that keep key actions obvious.
- **Voice:** Write like the lead engineer of a respected niche tool speaking to a peer: grounded, warmly professional, practical, and quietly proud of the craft.
- **Copy:** Use correct technical terms with simple framing. Be literal about what features do, how to use them, and their limits. No marketing fluff, overselling, legal jargon, fake excitement, or sanitized corporate voice.
- **UI Validation:** For frontend changes, use the T3 Code integrated browser to inspect every affected route at desktop and mobile sizes, exercise the changed behavior, and fix visual or runtime regressions before finishing. Report anything you could not validate.

# Workflow & Execution

- **Rule enforcement:** Follow every applicable rule in this file completely. Do not silently skip rules or invent exceptions.
- **Server:** Reuse running dev servers and their auto-reload. Check the required ports before browser validation; if a server is unavailable, start its existing `bun dev` script and report any startup failure. Do not start duplicate servers. Frontend: `5000`; backend: `3000`.
- **Dependencies:** Library replacements and their required packages are authorized within a rewrite. Choose tools that fit the product, explain consequential changes, and remove replaced dependencies. New packages outside that scope require approval.
- **Security:** Choose the most secure practical implementation; security and privacy take priority over convenience.
- **Database:** Do not add database fields for transient or derivable state. This app has no users or production data. Update the fresh initialization schema directly when persistent data changes. Do not add migrations or backfills for previous development schemas.
- **Compatibility:** Do not add or retain legacy compatibility code, deprecated contracts, old-format fallbacks, or dual implementations. Replace the old implementation and update every consumer.
- **Contracts:** When changing an API response, request body, validation rule, or shared domain concept, inspect every frontend and backend consumer. Update both ends in the same change and keep status codes and error shapes consistent.
- **Refactoring:** Refactor freely within the requested scope. Outline a plan first when work crosses subsystems or carries meaningful risk.
- **Clean-up:** Remove replaced code and stale logic so the codebase does not keep filler.
- **Tests:** Keep permanent unit, integration, contract, and end-to-end tests. Cover behavior, security boundaries, and failure recovery. Keep fixtures synthetic, isolate test databases and provider adapters, and exclude generated reports, credentials, and temporary artifacts from commits.
- **Before Finishing:** Run `bun format` and `bun lint`, then fix errors. For critical or broad changes, also run `bun run build` and preview when practical.
- **Subagents:** When delegating work, choose the model and reasoning effort that fit the task complexity instead of using one default for every subagent.

# Important Note

- Ignore unrelated uncommitted changes from other agents or me unless they directly interfere with your task.
