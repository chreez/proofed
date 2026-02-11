# Grooming Protocol

Use `/groom` for task grooming (Intent Translator MAX protocol).

## Draft-by-Default

All new tasks enter as Draft (`status: Draft`) unless groomed in the same session. Agents must never create To Do tasks without completing the clarify/intent loop first.

## Draft → Task Promotion

- New ideas enter as Drafts via MCP (`status: Draft`) — they live in `backlog/drafts/` with `DRAFT-X` IDs until groomed
- Grooming promotes a Draft to a PF- task (status To Do) with agent-verifiable ACs
- Legacy: some existing PF- tasks still have `ungroomed` label — groom in place, strip label when done

## Auto Groom

When the user says **"auto groom"**, the `/groom` skill skips the Clarify Loop and goes straight to Echo Check + Write ACs. Use context and silent scan to fill in gaps.

## Spike Subtasks

Create spike subtasks liberally when research is needed before implementation. See `/groom` skill for full details.

- **Spike ID format:** `PF-XX.1`, `PF-XX.2` (subtasks of the parent)
- Spikes are delegated to future agents — don't execute them in the current session
- Spike output → documented in parent task notes → informs implementation
