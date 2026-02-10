---
name: research
description: Multi-agent recipe research with parallel strategies, cross-source confidence ratings, and structured synthesis. Replicates the CoCo curry methodology.
user-invocable: true
allowed-tools: Read, Grep, Glob, Task, WebSearch, WebFetch, Write
model: opus
argument-hint: <recipe-subject> e.g. "CoCo Ichibanya curry" or "Neapolitan pizza dough"
---

# Recipe Research Skill

Launch a parallel multi-agent research operation to build a comprehensive, source-verified recipe from scratch. Produces a synthesis report with confidence-rated ingredients, technique consensus, and a full source registry.

## Usage

```
/research CoCo Ichibanya curry
/research Neapolitan pizza dough
/research Thai tea boba
```

## Process Overview

```
0. RECON     → Quick web scan to understand the dish before committing to strategies
1. DEFINE    → Confirm target with user, identify research angles
2. DEPLOY    → Launch 6-9 parallel agents with distinct strategies
3. FOLLOW-UP → Launch targeted agents for gaps found in first wave
4. SYNTHESIZE → Cross-reference, rate confidence, build master recipe
4b. REVIEW   → Present synthesis to user for approval before saving (HITL)
5. SAVE      → Write synthesis to photos-source/{id}/research/ + create recipe JSON
```

## Step 0: Recon Scan

Before anything else, run 2-3 quick web searches to understand what `$ARGUMENTS` actually is. The goal is to answer:

- **What exactly is this dish?** (origin, regional variants, defining characteristics)
- **Is it a restaurant clone, a technique, a regional specialty?** (determines which research angles matter)
- **What's the landscape?** (lots of recipes online = good cross-referencing potential; obscure = may need different approach)
- **Are there named variants or controversies?** (e.g., "Neapolitan pizza" has AVPN certification rules; "Nashville hot chicken" has Prince's vs Hattie B's debate)

### Recon searches

```
WebSearch: "{subject} recipe"          → landscape scan
WebSearch: "{subject} history origin"  → context and identity
WebSearch: "{subject} authentic vs"    → variants and debates
```

### Recon output

Present a brief summary to the user:

```
**Target**: {dish name}
**Identity**: {1-2 sentences — what defines this dish}
**Landscape**: {how much is online, key sources spotted}
**Variants**: {any forks/debates to be aware of}
**Recommended focus**: {which variant/version we're targeting}
```

Wait for user confirmation before proceeding. The user may narrow scope ("the Prince's version, not Hattie B's") or redirect ("actually I want the vegan version").

## Step 1: Define Research Angles

After user confirms the target, identify the research dimensions:

| Angle | What to Find | Example Query Pattern |
|-------|-------------|----------------------|
| **Copycat recipes** | Blog/YouTube recreations of the dish | "{subject} copycat recipe" |
| **Native sources** | Recipes in the dish's origin language | "{subject} in Japanese/Italian/Thai" |
| **Primary labels** | Manufacturer ingredient lists, retail products | "{subject} ingredient list label" |
| **Industry/corporate** | Business reporting, factory processes, supply chain | "{subject} manufacturer factory production" |
| **Community intel** | Reddit, forums, first-hand accounts | "reddit {subject} recipe secret ingredient" |
| **Technique science** | Food science behind key techniques | "{subject} technique food science serious eats" |
| **Brand/product reviews** | Product comparisons, brand rankings | "best {key-ingredient} brand for {subject}" |
| **Sourcing/shopping** | Where to buy specialty ingredients, substitutions | "{specialty-ingredient} where to buy substitute" |

Not all angles apply to every subject. Choose 6-9 based on the dish.

## Step 2: Deploy Parallel Agents

Launch agents using the Task tool with `run_in_background: true`. Each agent gets ONE strategy and searches independently.

### Agent Template

Each agent prompt should include:

```
You are researching "{subject}" using strategy: {STRATEGY_NAME}.

Context: {brief context about the dish and what we're building}

Your search strategy: {specific focus area}

Research these specific questions:
1. {question 1}
2. {question 2}
3. {question 3}

Deliverable: A structured report with:
- Findings organized by source
- Exact ingredient amounts when found
- Technique descriptions with attribution
- Source URLs for every claim
- Confidence assessment (how reliable is each source?)

Use WebSearch and WebFetch extensively. Search in multiple languages if relevant.
Cite EVERY claim with its source URL.
```

### Agent Naming Convention

Name agents by strategy: `"{subject} — {strategy}"` (e.g., "CoCo curry — copycat recipes")

### Minimum Agent Count: 6

Fewer than 6 agents won't produce enough cross-referencing for confidence ratings.

## Step 3: Follow-Up Agents

After first wave completes, review results for:

- **Gaps**: Ingredients mentioned but not sourced
- **Conflicts**: Different agents disagree on amounts/techniques
- **Primary sources**: Claims that need verification from manufacturer/official sources
- **Deep dives**: Unexpectedly rich veins (e.g., retail product labels revealing hidden ingredients)

Launch 2-3 targeted follow-up agents to fill gaps.

## Step 4: Synthesize

Cross-reference all agent results into a single synthesis document with these sections:

### Required Sections

1. **Executive Summary** — 2-3 sentences capturing the dish's identity and key insight

2. **Primary Source Evidence** — Hard facts from corporate, manufacturer, insider sources. Rate confidence: HIGH (legally required labels, corporate filings), MEDIUM (single insider, unverified), LOW (hearsay)

3. **Cross-Source Ingredient Confidence** — The core deliverable. For each ingredient:
   - Agent count: how many of N agents independently cited it
   - Tier 1 CONFIRMED (6+ agents), Tier 2 STRONG (4-5), Tier 3 SUPPORTING (2-3)
   - Brand/spec recommendation with source
   - Key sources list

4. **Technique Consensus** — Universal (all agents agree), Strong (majority), Notable (minority)

5. **Brand Rankings** — Product recommendations ranked by source consensus

6. **Shopping List** — Two sections: specialty market + regular grocery. Every item has exact brand, amount, and source URL

7. **Synthesized Master Recipe** — The actual recipe, combining highest-confidence ingredients and techniques

8. **Full Source Registry** — Every source with: ID, name, type, author, URL. Types: recipe-blog, youtube, reddit, industry, primary-label, review, journalism, manufacturer, guide

9. **Open Questions** — Things that need A/B testing, unresolved conflicts, single-source claims worth investigating

### Confidence Rating System

```
HIGH (6+ of N agents)  → Include in master recipe, high confidence
MEDIUM (3-5 of N)      → Include with "recommended" qualifier
LOW (1-2 of N)         → List in "open questions" for future testing
```

## Step 4b: Review Gate (HITL)

Before saving anything, present the synthesis to the user for review:

1. **Show the executive summary** and master recipe overview
2. **Flag open questions** — anything the user should weigh in on before it becomes a recipe
3. **Wait for explicit approval** — user may:
   - Approve as-is → proceed to Step 5
   - Request changes → revise synthesis and re-present
   - Flag items for further research → launch targeted follow-up agents, then re-synthesize

Do NOT save artifacts or create recipe JSON until the user confirms the synthesis quality.

## Step 5: Save Artifacts

### Synthesis Report
Save to: `photos-source/{recipe-id}/research/{recipe-id}-research-synthesis.md`

### Recipe JSON
If the research produces enough confidence for a recipe, create: `public/recipes/{recipe-id}.json`
- Follow the recipe JSON contract in CLAUDE.md
- Include structured source data (PF-38 schema)
- Add provenance metadata when PF-66 schema is available

### Backlog
- Create a nutrition data subtask (needs separate research)
- Create any spike subtasks for open questions worth investigating

## Arguments

- `$ARGUMENTS` — The recipe subject to research (required)

## Example: CoCo Curry Session Stats

The methodology above was developed during the CoCo Ichibanya curry research (2026-02-07):

- **9 agents** deployed (6 initial + 3 follow-up)
- **60+ unique sources** consulted
- **64 sources** in final registry
- **8 Tier 1 ingredients** (confirmed by 6-7/7 agents)
- **8 Tier 2 ingredients** (strong, 4-5/7 agents)
- **12 Tier 3 ingredients** (supporting, 1-3/7 agents)
- **12 open questions** for future A/B testing
- Synthesis report: `photos-source/coco-curry/research/coco-curry-research-synthesis.md`

## Notes

- This is an expensive operation (many parallel agents with web search). Use intentionally.
- Quality depends on the dish having enough online presence. Obscure regional dishes may not yield enough cross-referencing.
- The overnight rest between research and recipe writing improves synthesis quality — but is not required.
- Always attribute sources. This is a personal notebook, not plagiarism.
