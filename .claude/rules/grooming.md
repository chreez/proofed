# Grooming Protocol

Use `/groom` for task grooming (Intent Translator MAX protocol).

## Draft-by-Default

All new tasks enter as Draft (`status: Draft`) unless groomed in the same session. Agents must never create To Do tasks without completing the clarify/intent loop first.

## Draft → Task Promotion

- New ideas enter as Drafts via MCP (`status: Draft`) — they live in `backlog/drafts/` with `DRAFT-X` IDs until groomed
- Grooming promotes a Draft to a PF- task (status To Do) with agent-verifiable ACs
- **Use `backlog draft promote DRAFT-X`** to promote — this moves the file from `backlog/drafts/` to `backlog/tasks/` and assigns a PF- ID. Do NOT use `task_edit` to change a draft's status directly, as the file will stay in the wrong directory.
- **Post-promotion verify:** after promoting, confirm the draft file is gone from `backlog/drafts/` (e.g., `ls backlog/drafts/ | grep -i <id>`). Stage the new task file in `backlog/tasks/`.
- Legacy: some existing PF- tasks still have `ungroomed` label — groom in place, strip label when done

## Auto Groom

When the user says **"auto groom"**, the `/groom` skill skips the Clarify Loop and goes straight to Echo Check + Write ACs. Use context and silent scan to fill in gaps.

## Spike Subtasks

Create spike subtasks liberally when research is needed before implementation. See `/groom` skill for full details.

- **Spike ID format:** `PF-XX.1`, `PF-XX.2` (subtasks of the parent)
- Spikes are delegated to future agents — don't execute them in the current session
- Spike output → documented in parent task notes → informs implementation

## Spike Completion Requirements

A spike cannot be marked Done until:

1. **Research notes exist** — findings documented in spike notes file (`backlog/tasks/pf-XXX-spike-notes.md`) or inline on the task
2. **Architecture decision documented** — if the spike involved a build-vs-buy or design choice, the chosen approach and rationale must be recorded on the task
3. **≥1 draft task per actionable finding** — spike output must be translated into concrete follow-up tasks (as Drafts in `backlog/drafts/`). These reference the spike as source.
4. **User has reviewed findings** — spikes require human sign-off before closing. The agent cannot self-close a spike.

Spike → Draft flow: research produces findings → agent creates Draft tasks from findings → user reviews spike + drafts → user approves → spike marked Done, drafts ready for grooming.

**Demo artifacts:** If a spike produced demo pages (`public/demo/`), note them on the task as visual references for the executor agent. Demo files should be cleaned up when actual implementation ships.
