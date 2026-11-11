# Claude Code in this kit

The rules, skills and commands are the kit's texts from `agents/`, copied here by `npm run agents:sync`. They
speak of every agent alike; in Claude Code these differ:

- **Independent review** — wherever a text says `/review` in a new chat, run the `reviewer` subagent with the same
  line: `<plan path> #<n> … — <spec paths>`. Its context is fresh, so its report is the full independent review:
  the summary says `full`, never "waiting for /review". There is no `/review` command here.
- **Commands** — `/setup`, `/plan`, `/implement`, `/verify`, `/heal`, `/coverage`, `/triage` (`.claude/commands/`),
  each opening its skill (`.claude/skills/`).
- **The live app** — the Playwright MCP from `.mcp.json`; approve it once when Claude Code asks. Without it, the
  saved-session script (`live-app.md`).
- **Permissions** (`.claude/settings.json`, from `agents/permissions.json`) — the browser tools, the kit's `npm run`
  and `node scripts/` commands and git that only reads run without asking; reading cookies or storage is denied
  (`02-guardrails.md`); code run unsafely in the page asks first.
