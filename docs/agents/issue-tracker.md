# Issue tracker: Linear

Issues and specs for this repo live in Linear, team **Te-inscreve** (key `TE`, identifiers like `TE-123`). Use the Linear MCP tools for all operations.

The `TE` team is shared with the backend repo. Issues created from this repo carry the `Frontend` label; add `Backend` too when the work crosses into the API.

## Conventions

- **Create an issue**: `save_issue` with `team: "Te-inscreve"`, `title`, `description` (Markdown) and `labels: ["Frontend", ...]`. No `id` means create.
- **Read an issue**: `get_issue` with the identifier (`TE-123`); `list_comments` for the thread.
- **List issues**: `list_issues` filtered by `team: "Te-inscreve"`, plus `label` / `state` / `assignee` as needed.
- **Make an issue a sub-issue of a parent**: `save_issue` with `parentId: "TE-<parent>"`.
- **Comment on an issue**: `save_comment` with the issue identifier and a Markdown `body`.
- **Apply / remove labels**: `save_issue` with `id` and `addLabels` / `removeLabels`. Avoid `labels`, which replaces the whole set.
- **Close**: comment with the reason, then `save_issue` with `state: "Done"` (resolved), `"Canceled"` (won't do) or `"Duplicate"` plus `duplicateOf`.

Team workflow states: `Backlog` → `Todo` → `In Progress` → `In Review` → `Done` / `Canceled` / `Duplicate`.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

PRs live on GitHub (`te-inscreve/frontend-web`). When set to `yes`, read them with `gh pr view <number> --comments` / `gh pr diff <number>` and track the request as a Linear issue linked to the PR (`save_issue` with `links: [{url, title}]`).

## When a skill says "publish to the issue tracker"

Create a Linear issue in team `TE` with the `Frontend` label.

## When a skill says "fetch the relevant ticket"

Read it as in **Read an issue** above.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body. Create the label first if it's missing (`save_issue_label` on team `TE`).
- **Child ticket**: a sub-issue of the map (`parentId`). Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: Linear's native relations: `save_issue` with `id: "TE-<child>"` and `blockedBy: ["TE-<blocker>"]`. A ticket is unblocked when every blocker is in a completed or canceled state.
- **Frontier query**: `list_issues` for the map's open children (state not `Done`/`Canceled`/`Duplicate`), drop any with an open blocker or an assignee; first in map order wins.
- **Claim**: `save_issue` with `id` and `assignee: "me"`, the session's first write.
- **Resolve**: `save_comment` with the answer, then `save_issue` with `state: "Done"`, then append a context pointer (gist + `TE-<n>` link) to the map's Decisions-so-far.
