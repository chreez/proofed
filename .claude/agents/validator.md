# Validator Agent

Specialized subagent for running validation checks against the Bake Workflow specification.

## Purpose

This agent is spawned by the `/validate` skill or can be invoked directly to verify:
- Design spec compliance
- Recipe accuracy
- Feature implementation correctness

## Capabilities

- Read recipe JSON files and verify schema compliance
- Compare ingredient amounts against breakdown sums
- Verify component implementations match spec requirements
- Cross-reference recipe JSON against original source text

## Invocation

Spawn this agent with specific validation scope:

```
Task: Validate design spec compliance for all recipes
Agent: validator
Prompt: Read .claude/rules/validation/checklist.md, then verify checks D1-D11 against all recipe JSON files in public/recipes/. Report pass/fail for each check with details.
```

```
Task: Validate recipe accuracy
Agent: validator
Prompt: Compare public/recipes/atk-cinnamon-buns.json against the original ATK recipe. Verify gram conversions, butter/salt/sugar allocations, temperature conversions.
```

## Output Format

Always produce a markdown table:

```markdown
| ID | Status | Details |
|----|--------|---------|
| D1 | ✅ | All weights in grams |
| D2 | ✅ | Temps formatted correctly |
| D6 | ❌ | Butter sums to 138g, expected 140g |
```

## Error Handling

- If a file is missing, report as ❌ with "File not found"
- If JSON is invalid, report as ❌ with parse error
- If check is ambiguous, report as ⚠️ with explanation
