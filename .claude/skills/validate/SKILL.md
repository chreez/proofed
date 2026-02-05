---
name: validate
description: Run validation checks against the bake workflow spec. Use after any feature work or recipe changes.
user-invocable: true
allowed-tools: Read, Grep, Glob, Task
model: sonnet
argument-hint: [recipe-name] or blank for all
---

# Validation Skill

Run comprehensive validation against the Bake Workflow spec.

## Usage

```
/validate                    # Validate all recipes and components
/validate atk-cinnamon-buns  # Validate specific recipe
```

## Execution Steps

### Step 1: Load Validation Checklist

Read the validation checklist:
```
@.claude/rules/validation/checklist.md
```

### Step 2: Spawn Validation Subagents

Launch parallel validation agents for efficiency:

**Design Spec Agent** - Verify D1-D11 checks:
- Read all recipe JSON files in `public/recipes/`
- Verify units, timer flags, exit conditions, breakdowns
- Check component implementations

**Recipe Accuracy Agent** - Verify R1-R8 checks (if recipe specified):
- Compare recipe JSON against original source
- Validate gram conversions, allocations, temperatures

**Feature Check Agent** - Verify F1-Fn checks:
- Test feature implementations
- Verify behaviors match spec

### Step 3: Aggregate Results

Collect results from all subagents and produce summary:

```markdown
## Validation Report - [DATE]

### Design Spec: X/11 PASS
| ID | Status | Details |
|----|--------|---------|
...

### Recipe Accuracy: X/8 PASS
| ID | Status | Details |
|----|--------|---------|
...

### Feature Checks: X/N PASS
| ID | Status | Details |
|----|--------|---------|
...

### Fixes Required
1. [File:Line] - Description of fix
2. ...
```

### Step 4: Update Checklist (if new checks needed)

If validation reveals missing checks, propose additions to:
`.claude/rules/validation/checklist.md`

## Arguments

- `$ARGUMENTS[0]` - Optional recipe name to validate (e.g., `atk-cinnamon-buns`)
- If blank, validate all recipes

## Notes

- This skill should be run after every feature release
- Validation is non-destructive (read-only analysis)
- Failed checks should be fixed before considering work complete

## Workflow Reminder

Before implementing ANY feature:
1. **CLARIFY** - Ask questions until intent is ≥95% clear
2. **CHECKLIST** - Add validation criteria to `.claude/rules/validation/checklist.md`
3. **IMPLEMENT** - Then build
4. **VALIDATE** - Run this skill

If checklist wasn't updated before implementation, flag this as a process violation.
