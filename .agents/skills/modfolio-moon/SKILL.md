---
name: modfolio-moon
description: >-
  Wrap up a Modfolio session at any point: measure the state, write a per-session handoff file whose
  facts are pre-filled, fill its four narrative slots, commit it, run the full gate once and push,
  reporting maintenance (harness, installs, version bumps) for the owner to choose. The next session
  starts with /modfolio-sun.
---

<!-- MODFOLIO_ADAPTER: 1 -->

# /modfolio-moon — wrap up at any point

Run it and report its output and **exit code**:

```bash
bun run modfolio:moon -- --slug <short-name>
```

If that script is not declared here, run the harness copy directly:

```bash
bun node_modules/@modfolio/harness/scripts/modfolio/moon.ts --slug <short-name>
```

Pass `--slug` from the start — the script has no help mode, and any run writes the skeleton.
It writes `knowledge/handoff/<YYYYMMDD-HHMM>-<slug>.md` with the facts filled in. Then:

1. **Start no new work.** The point is to draw a boundary the next session can pick up from.
2. Fill only the four narrative slots — 한 일 (done, with evidence; do not hide what is unfinished),
   다음 할 일 (next steps, first command ready), 결정 대기 (owner decisions, or «없음»),
   지뢰 (pitfalls, or «없음»). At most 80 lines; no pasted logs. Carry over the gist of an active
   plan file if there is one.
3. If it reports other sessions in the same checkout, ask the owner before committing changes
   outside the handoff. **Moon never integrates code**: uncommitted changes outside the handoff go
   to `bun run modfolio:moon -- --wip`, which commits them to a `wip/<stamp>-<slug>` branch, pushes
   it after a secret sweep without switching the branch, and then takes those changes out of the
   working tree so the full gate measures only what you push (files changed or partially staged after the
   snapshot, and a checkout shared with another session or on a host without `/proc`, are left alone — `--park` forces it). Put the restore command it prints in the
   next steps — never leave work only on this machine.
4. Maintenance (harness update, installs, tool versions) is **reported**; apply only what the
   owner picks. In an unattended run, record it and do nothing.
5. `bun run modfolio:moon -- --finish` (refuses while a slot is empty; commits only the handoff and
   its index), then `bun run gate:full` on its own and branch on its exit code: 0 → `git push`
   (never force) and confirm each remote with `git ls-remote`; non-zero → fix and rerun, or record it
   under 지뢰 and keep the code on `--wip`. Unpushed commits outside the handoff are pushed only if
   `review:run` approved them.
6. If an autonomous run is active, finish with `bun run modfolio:nonstop -- close "<reason>"`. If the
   session taught a reusable judgment, write one `/debrief` card. If the task root has a
   `claude-progress.txt`, append this session's entry to it (canon `long-running-harness.md`).
7. Tell the owner the next session starts with `/modfolio-sun` (or `/compact` to continue
   the same remote session). During an autonomous run, a long context is not a reason to wrap up —
   use `/compact` so the run continues.

Moving several repositories to another device is a separate step: `bun run handoff:prepare:apply`.
