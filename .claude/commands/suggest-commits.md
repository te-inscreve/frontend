---
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git ls-files:*), Bash(git add:*), Bash(git commit:*), AskFollowupQuestion
description: Analyze staged and unversioned files, suggest semantic commits grouped by topic, and execute after user approval
---

## Context

- Current git status: !`git status`
- Staged diff: !`git diff --cached`
- Unstaged diff: !`git diff`
- Untracked files: !`git ls-files --others --exclude-standard`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -10`

## Your task

---

### Step 1 — Ask user preferences

Use `AskFollowupQuestion` to ask all questions at once before doing anything else:

1. **Commit granularity** — How granular should the commits be?
   - Fine-grained (one commit per file or feature, maximum traceability)
   - Balanced (group related files by topic, recommended)
   - Coarse-grained (fewest commits possible, one per broad area)

2. **Commit message language** — Which language for commit messages?
   - English
   - Portuguese (pt-BR)

3. **Scope in commit message** — Include scope in conventional commits format?
   - Yes — e.g. `feat(auth): add login page`
   - No — e.g. `feat: add login page`

4. **Breaking changes** — Flag potentially breaking changes with `!` or `BREAKING CHANGE`?
   - Yes, flag them
   - No, skip that

Wait for the user's answers before proceeding.

---

### Step 2 — Analyze the repository

Using the context above and the user's preferences, analyze ALL modified, staged, and unversioned files. For untracked files, use `git ls-files` and `git diff` to inspect their content before grouping.

#### Grouping rules

1. Group files that share the same functional purpose or area of the codebase.
2. Apply the granularity level chosen by the user:
   - **Fine-grained**: prefer one commit per file or isolated change
   - **Balanced**: group files that clearly belong to the same feature or fix
   - **Coarse-grained**: merge related topics into broad commits
3. Use conventional commits format for the title: `type(scope): short description`
   - Types: `feat`, `fix`, `refactor`, `style`, `chore`, `docs`, `test`, `perf`
   - Include scope only if the user chose Yes in question 3
   - Add `!` after type if the user chose Yes in question 4 and the change is breaking
4. Write commit messages in the language chosen by the user in question 2.

#### Commit message rules

Every commit must have:

- **Title**: one line, max 72 chars, conventional commits format
- **Body**: 2–5 bullet points explaining *what* changed and *why*, written in the same language chosen by the user. Each bullet should be a concise sentence starting with a verb. Leave one blank line between title and body.

---

### Step 3 — Present the commit plan and ask for approval

Print the full suggested commit plan in this format:

```
## Suggested Commits

### Commit 1
git add <file1> <file2>
git commit -m "type(scope): short title" \
  -m "- Bullet explaining what changed and why
- Bullet explaining what changed and why
- Bullet explaining what changed and why"

### Commit 2
git add <file3>
git commit -m "type(scope): short title" \
  -m "- Bullet explaining what changed and why
- Bullet explaining what changed and why"

(repeat for each group)

— X commits suggested · granularity: <chosen level> · language: <chosen language>
```

Then use `AskFollowupQuestion` to ask:

> **Ready to commit?**
>
> - ✅ Yes, execute all commits as suggested
> - ✏️ I want to adjust something (describe what)
> - ❌ No, cancel

---

### Step 4 — Handle the user's response

#### If the user chose ✅ Yes

Execute each commit sequentially using the exact `-m title -m body` format:

1. Run `git add <files>` for the group
2. Run `git commit -m "type(scope): title" -m "- bullet\n- bullet\n- bullet"` for that group
3. Repeat for every commit in the plan
4. After all commits, print:

```
✅ Done! X commits created on branch <branch>.
```

#### If the user chose ✏️ Adjust

- Read the user's requested adjustments (e.g., merge two commits, change a message, move a file to a different group)
- Rebuild the commit plan applying the changes
- Return to **Step 3** and show the updated plan for approval again

#### If the user chose ❌ Cancel

Print:

```
🚫 No changes were made to the repository.
```

Stop immediately. Do not run any git write commands.