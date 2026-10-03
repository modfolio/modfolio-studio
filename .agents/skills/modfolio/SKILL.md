---
name: modfolio
description: >-
  Check, at any point in a session, that this repository still follows the Modfolio universe: its
  laws, rules, configuration and structure, features built only in their owner repository, and no
  duplicate implementation of a capability. --card is the card alone, --intent names the owner and
  existing parts for a piece of work, --deep is the fourteen-track diagnosis. Session start is
  /modfolio-sun; wrap-up is /modfolio-moon.
---

<!-- MODFOLIO_ADAPTER: 1 -->

# /modfolio — identity and law check (any time)

Run it and report its output and **exit code**:

```bash
bun run modfolio:compass
```

If that script is not declared here, run the harness copy directly:

```bash
bun node_modules/@modfolio/harness/scripts/modfolio/compass.ts
```

Exit 0 means compliant, 1 means a violation, 2 means undecidable; with both a violation and an
undecidable line the exit is 1. **The exit code is the verdict — never the printed text.** When a
line is marked ✗, fix that line first; a line marked `?` was **not measured**, which is not the
same as «fine». Lines that say «미검사» name what this tree cannot measure (cross-repo duplicate
implementations, owner bypass, clone fingerprints, events without a contract) — report them as
unchecked, never as healthy.

The card comes first (laws, composition rule, boundaries, lock, gate wiring), then the
conformance section: the five laws, effort policy versus the effective value, the compaction
window, the review policy, and whether the three session commands exist on every surface. It reads
existing evidence instead of rerunning heavy checks. Every ⚠ or ✗ carries a one-line fix — apply it
without abandoning the current task, except maintenance (harness update, installs, version bumps)
and exceptions the owner asked for (such as an effort override): report those and let the owner
choose. This command itself never edits files.

Two things the script **cannot** see and must not be reported as healthy: MCP server
connections and the hook layer. Report failed MCP servers yourself, and probe hooks with
`true # hook-probe` on the first Bash call.

## Other modes

- `bun run modfolio:compass -- --card` — the card alone, no network, under a second.
- `bun run modfolio:compass -- --intent "<what you are about to do>"` — before a new
  feature: who owns this capability and which parts already exist. Name a package or API when you
  can; a broad sentence yields «undecidable», and that answer is correct.
- `bun run modfolio -- --deep` — fourteen-track diagnosis (minutes; read-only).

## The rest of the commands

`MODFOLIO.md` §Commands holds the table, and it is the same table for every tool —
the effect lives in the script, so a command means the same thing in Claude Code, Antigravity
and Codex. Longer procedures live under `.claude/skills/`; that is a legacy path, not a
Claude-only one. Read the one the task names when you need it.
