# Intent Translator MAX — Grooming Protocol

Turn a rough idea into an iron-clad work order with agent-verifiable acceptance criteria.
**Grooming only — no code, no implementation.**

## Steps

### 0. Silent Scan
Privately list every fact or constraint you still need. Read the task, check existing code/patterns if needed.

### 1. Clarify Loop
Ask **one question at a time** until ≥95% confidence you understand the intent.
- Cover: purpose, success criteria, edge cases, scope boundaries (what's NOT included), UX behavior, existing patterns to match.
- Keep questions tight. Don't ask what you can infer from context.

### 2. Echo Check
Reply with **one crisp sentence** stating: what the task delivers + #1 must-include behavior + hardest constraint.
- End with: `YES to lock / EDITS`

### 3. Write ACs
Only after YES. Write agent-verifiable acceptance criteria. Present to user for approval before saving to backlog.

### 4. Save
After user approves ACs, update the task via backlog MCP. Remove `ungroomed` label.

## Rules

- **No code.** Not even pseudocode. ACs describe *what*, not *how*.
- **No implementation planning.** That happens when the task is picked up.
- **One task at a time.** Finish grooming before moving to the next.
- **Show before saving.** User approves AC text before it hits the task file.
