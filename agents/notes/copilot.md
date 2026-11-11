# GitHub Copilot in this kit

The rules, skills and commands are the kit's texts from `agents/`, copied here by `npm run agents:sync`: the
always-on rules below, the others in `.github/instructions/` (each for the files its `applyTo` names), the skills
in `.github/skills/`. They speak of every agent alike; in Copilot these differ:

- **Commands** — skills you call by name: `/setup`, `/plan`, `/implement`, `/verify`, and `/heal`, `/triage`,
  `/coverage`, each opening its part of the verify skill. "The setup skill" in a text is `.github/skills/setup/SKILL.md`.
- **Independent review** — wherever a text says `/review` in a new chat, hand the same line to the `reviewer`
  agent (`.github/agents/reviewer.agent.md`): `<plan path> #<n> … — <spec paths>`. Its context is fresh, so its
  report is the full independent review; the summary says `full`, never "waiting for /review".
- **The rules by file** — before you write a plan, a spec, a Page Object, a client or a fixture, read its rule in
  `.github/instructions/` (`plans`, `specs`, `ui`, `api`, `code`, `data-and-fixtures`, `live-app`) when it is not
  in your context yet; a text naming `plans.md` means `.github/instructions/plans.instructions.md`.
- **The live app** — the Playwright MCP from `.mcp.json`. Without it, the saved-session script (`live-app.md`).
- **Before you stop** — the stop check (`.github/hooks/playwright-ai-kit.json`) may send you back once: do what it
  says; a question the user must answer first → ask it and stop again.
