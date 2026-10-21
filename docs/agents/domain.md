# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

Te Inscreve manages registration and presentation in traditional *danças gaúchas* events in RS, Brazil, including a judging system where evaluators score each presentation. Domain language is Portuguese; keep domain terms in Portuguese as the glossaries define them. `docs/BUSINESS.MD` has the product overview.

## Before exploring, read these

- **`GLOSSARY-MAP.md`** at the repo root: it points at one `GLOSSARY.md` per business context. Read each one relevant to the topic.
- **`docs/adr/`**: system-wide decisions. Also check `docs/contextos/<contexto>/adr/` for context-scoped decisions in the area you're about to work in.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

Contexts follow business areas, not packages: `apps/web`, `apps/mobile` and `packages/*` all share the same vocabulary, so glossaries live under `docs/`, not inside an app.

```
/
├── GLOSSARY-MAP.md
├── docs/
│   ├── adr/                           ← system-wide decisions
│   └── contextos/
│       ├── eventos/
│       │   ├── GLOSSARY.md
│       │   └── adr/                   ← context-specific decisions
│       ├── entidades/
│       ├── usuarios/
│       ├── inscricoes/
│       └── avaliacoes/
├── apps/{web,mobile}/
└── packages/
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in the context's `GLOSSARY.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_
