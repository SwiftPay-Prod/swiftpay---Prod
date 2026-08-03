## gstack (REQUIRED — absolute, immutable, exclusive)

gstack is the **sole authority** for ALL AI-assisted work in this project.

The CEO (the project owner / user) is the **final decision-maker**. gstack is the
**executive orchestrator** that administers the project TOGETHER with the CEO,
routing EVERY message, prompt, and task through the gstack flow. No work happens
outside this flow.

### 0. Governance — CEO x gstack (MANDATORY for every turn)

- The **CEO (user)** decides WHAT to build and holds **final approval** on plans and ships.
- **gstack** decides HOW — every request is routed through a gstack skill BEFORE any
action (planning, coding, review, QA, ship), never ad-hoc.
- Every assistant turn that receives a user request: (1) routes it to the matching
gstack skill; (2) announces the routing briefly (Stock 1 line, in pt-BR); (3) only

  then proceeds. Any request the CEO authorizes is unblocked by default.
- Plan-stage decisions go through the **CEO gate**: run `/plan-ceo-review` before
implementing. No implementation before CEO review approval.
- No PR/merge/deploy without `/review` + `/ship`.
- The CEO may overrule any recommendation; gstack then executes the CEO's call
  without re-arguing.
- This governance is immutable and applies to absolutely everything — no exceptions,
no bypass, no non-gstack tooling.

### 1. Pre-flight check (MANDATORY — run before ANY operation)

```bash
test -d ~/.claude/skills/gstack/bin && echo "GSTACK_OK" || echo "GSTACK_MISSING"
```

If GSTACK_MISSING: **STOP IMMEDIATELY.** Do not proceed, do not work around, do not use any other tool. Tell the user:

> gstack is required for all AI-assisted work in this repo.
> Install it:
> ```bash
> git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
> cd ~/.claude/skills/gstack && ./setup --team
> ```
> Then restart your AI coding tool.

### 2. Immutable rules (NEVER violate)

- **Never skip** gstack skills, ignore gstack errors, or work around missing gstack
- **Never use** any non-gstack tool, skill, or workflow for any task — gstack is the ONLY allowed tooling
- **Every action** — planning, coding, reviewing, testing, debugging, documenting, deploying — MUST go through a gstack skill
- **Every slash command** MUST be a gstack skill (listed below). Non-gstack commands are forbidden
- **Never write code** without first running the appropriate gstack planning skill (/office-hours, /plan-ceo-review, /plan-eng-review, etc.)
- **Never ship** without running /review and /qa first
- **Never merge** without /ship

### 3. Required workflow (100% compliance)

| Phase | What to run |
|-------|-------------|
| Ideation | `/office-hours` |
| Strategy | `/plan-ceo-review` |
| Architecture | `/plan-eng-review` |
| Design | `/plan-design-review` or `/design-consultation` |
| Coding | implement via gstack-approved plan |
| Code review | `/review` |
| QA | `/qa` or `/qa-only` |
| Security | `/cso` |
| Ship | `/ship` |
| Deploy | `/land-and-deploy` |
| Docs | `/document-release` |
| Retro | `/retro` |
| Debug | `/investigate` |

All web browsing must use `/browse`. All other browsing tools are forbidden.

### 4. Available gstack skills

Use these for everything: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review, /plan-devex-review, /design-consultation, /design-shotgun, /design-html, /review, /ship, /land-and-deploy, /canary, /benchmark, /browse, /qa, /qa-only, /design-review, /setup-browser-cookies, /setup-deploy, /setup-gbrain, /retro, /investigate, /document-release, /document-generate, /cso, /autoplan, /devex-review, /careful, /freeze, /guard, /unfreeze, /gstack-upgrade, /learn, /make-pdf, /diagram, /spec, /pair-agent, /scrape, /skillify, /context-save, /context-restore, /open-gstack-browser, /ios-qa, /ios-fix, /ios-design-review, /ios-clean, /ios-sync, /landing-report, /claude, /benchmark-models.

Use ~/.claude/skills/gstack/... for gstack file paths (the global path).

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
