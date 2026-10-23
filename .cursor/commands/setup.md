Use Skill: @.cursor/skills/setup/SKILL.md — §2 "Add an app" (a fresh clone checked first), §3 "Sign-in", §3.9 "A further account or role".

Registers an app (its rows in `specs/project-map.md`, its `.env` names, `npm run app:add -- <app>`, its sign-in and a
first green sign-in smoke), sets up how its tests sign in, or adds another account or role. You type passwords
into `.env` yourself — never into this chat.

What: <app | sign-in | another account or role>
App (optional — the skill asks when empty): <the app's dev or QA URL for a new app, or its slug>
Details (optional): <a name (kebab-case) for a new app | sign-in broken, change how tests sign in | the role, e.g. "a member without admin rights">
