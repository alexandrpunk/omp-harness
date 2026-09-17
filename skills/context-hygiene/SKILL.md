---
name: context-hygiene
description: Token optimization — when to delegate, when to compact, how to read minimally
---

# context-hygiene

Token-optimization discipline.

## Delegation
- Delegate to subagents: bounded, self-contained tasks (search & summarize, test writing, mechanical edits, doc updates) — cheap subagent context, not main context.
- Work directly: ambiguous multi-file reasoning, tight iterative debugging with the user in the loop.

## Compaction
- Compact at phase boundaries (after planning, after implementation, after review) — never mid-task.
- Summarize decisions and open questions before compacting.

## Reading
- Read only the line ranges needed (`read` with offset/limit); locate first with grep.
- Prefer grep and AST search over reading whole files. Never dump a full file when a pattern search answers the question.
- Skip generated files, lockfiles, and build output.

## Output
- Silent mode: minimal responses — no restating the task, no summarizing what wasn't asked, no filler.
