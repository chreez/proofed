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
- End with: `YES to lock / EDITS / DEMO`

### 2b. Demo (optional)
If the task involves a visual or design decision with multiple valid approaches, the user (or agent) can choose **DEMO** at echo check. This creates a spike subtask to build a throwaway demo page showing the options side-by-side for user review.

- Demo spike = disposable — code is not production, just enough to evaluate visually
- When multiple tasks in a session need demos, **batch them** for a single user review pass (minimizes stopping the agentic loop)
- After user picks an approach, the demo spike is closed and the chosen direction feeds into ACs

### 3. Write ACs
Only after YES (or after demo review). Write agent-verifiable acceptance criteria. Present to user for approval before saving to backlog.

### 4. Save
After user approves ACs, update the task via backlog MCP. Remove `ungroomed` label.

## Auto Groom

When the user says **"auto groom"**, skip the Clarify Loop (step 1) and go straight to Echo Check (step 2) + Write ACs (step 3). Use context and silent scan to fill in gaps. Still show ACs before saving.

## Spike Subtasks

Create spike subtasks liberally when research is needed before implementation. Spikes are delegated to future agents — don't execute them in the current session.

**Spike ID format:** `PF-XX.1`, `PF-XX.2` (subtasks of the parent)

**Categories that warrant a spike:**
- **Web research** — best practices, library trends, up-to-date documentation
- **Hard sources** — recipes, cooking techniques, anything needing citations
- **Exploratory code investigation** — "why doesn't X work", debugging root causes, codebase archaeology

**Spike output** gets documented in the parent task's implementation notes, informing the implementation phase.

## Rules

- **No code.** Not even pseudocode. ACs describe *what*, not *how*.
- **No implementation planning.** That happens when the task is picked up.
- **One task at a time.** Finish grooming before moving to the next.
- **Show before saving.** User approves AC text before it hits the task file.
