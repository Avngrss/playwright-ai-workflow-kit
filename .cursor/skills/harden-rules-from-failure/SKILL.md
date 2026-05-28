# Skill: Harden Rules From Failure

## Goal

Use this skill after a failure, flaky test, review finding, or repeated AI mistake reveals a reusable architectural risk.

The goal is to decide whether to update rules, skills, helpers, project map, or documentation to prevent recurrence.

Do not add rules for one-off issues.

---

## Related Rules

Follow these rules:

- Agent Workflow;
- Test Isolation, Flakiness, and Diagnostics Rules;
- Core Playwright Rules;
- Core / Project Boundary and Structure Rules;
- Project Map Rules;
- Examples Policy.

---

## When To Use

Use this skill when:

- the same mistake happens repeatedly;
- healer fixed a root cause that may recur;
- review found a missing convention;
- AI generated the same bad pattern multiple times;
- test instability reveals a systemic gap;
- project map is missing source-of-truth information;
- rules are ambiguous or conflicting;
- a skill needs a clearer procedure.

---

## When NOT To Use

Do not use this skill when:

- the problem is one-off;
- the issue is caused by simple typo;
- the rule already covers the problem clearly;
- the fix belongs only in implementation code;
- adding a rule would create noise;
- the issue is project-specific and should be handled by project documentation.

---

## Workflow

### 1. Identify the Trigger

Capture:

- failure;
- flaky pattern;
- review finding;
- repeated AI mistake;
- unclear ownership;
- missing convention.

---

### 2. Determine Recurrence Risk

Ask:

- can this happen again?
- is this caused by missing rule?
- is this caused by unclear skill?
- is this caused by missing project map entry?
- is this caused by missing helper or abstraction?
- is this project-specific or universal?

---

### 3. Choose Hardening Type

Choose one or more:

- update existing rule;
- update existing skill;
- update project map;
- add small helper;
- improve diagnostics;
- add review checklist item;
- add project-specific documentation;
- do nothing if one-off.

Prefer updating existing rules over creating new ones.

---

### 4. Avoid Duplicates

Before adding anything, check existing:

- rules;
- skills;
- project map;
- README or documentation;
- helpers;
- review checklists.

Do not create duplicate guidance.

---

### 5. Apply Minimal Hardening

Make the smallest useful update.

Rules:

- do not rewrite large rule files unnecessarily;
- do not add project-specific details to universal rules;
- do not create a new rule for a narrow one-off;
- do not conflict with existing rules;
- keep wording actionable.

---

## Output Format

### Trigger

- source:
- issue:
- impact:

### Recurrence Assessment

- one-off or recurring:
- evidence:
- affected layer:

### Hardening Decision

Use one:

- update rule;
- update skill;
- update project map;
- add helper;
- improve diagnostics;
- no hardening needed.

### Change Summary

- files updated:
- what changed:
- why this prevents recurrence:

### Verification

- consistency checked:
- conflicts checked:
- quality gate, if applicable:

---

## Guardrails

Do not:

- add rules for one-off issues;
- duplicate existing rules;
- create conflicting guidance;
- add project-specific requirements to universal rules;
- overfit rule text to one test;
- use hardening to justify broad refactoring;
- change implementation behavior unless required.

---

## Done Criteria

This skill is complete when:

- recurrence risk was assessed;
- existing guidance was checked;
- hardening type was selected;
- update was minimal;
- no duplicate/conflicting rule was introduced;
- reason for hardening is clear.

---

## Main Principle

Harden reusable learnings only.

Do not turn every bug into a rule.