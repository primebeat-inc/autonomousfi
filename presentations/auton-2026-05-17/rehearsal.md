# AUTON 2026-05-17 Rehearsal Script

CEO use only. Run through this 09:00-11:00 on 2026-05-17 morning before heading to the venue.

## 0. Environment sanity (10 min, do at home before leaving)

```bash
cd ~/Documents/dev/agentic-finance/autonomousfi
git status                       # must be clean, on main
git pull --ff-only origin main   # any overnight remote fixes
pnpm install                     # ensure lockfile reproducibility
pnpm -r run test                 # all 49 SDK tests must pass
```

If `pnpm install` complains about lockfile drift, fix and commit before leaving for the venue.

## 1. Demo smoke test (5 min, do at home before leaving)

```bash
cd packages/crewai-plugin
source .venv/bin/activate         # if venv was already created previously
# else: uv venv && uv pip install -e '.[dev]'
cd ../..
time python demos/agent_to_agent_review.py
```

Expected output (terminal must show all three lines):

```
{'status': 'settled', 'score': 0.9, 'result': '...'}

SUCCESS: agent A paid agent B 100 USDT (mock) for the review.
```

`time` should report under 8 seconds wall clock. If first run is slow because of `tsx` cold start, run it a second time.

If the demo fails locally, **do not present live**. Switch to the recorded fallback (see Section 4).

## 2. Backup video / recording (15 min, do at home)

Record a clean run of `demos/agent_to_agent_review.py` with terminal capture (use macOS built-in QuickTime screen recording or `asciinema rec`). Save as `presentations/auton-2026-05-17/demo-recording.mp4` (or `.cast`). Commit and push so the recording is in the public repo by venue arrival.

This is the safety net for Section 4. Do not skip.

## 3. At the venue (T-30 min before talk)

1. Plug laptop into projector or HDMI capture
2. Open terminal in dark theme, font size 18+ for back-row legibility
3. Open `presentations/auton-2026-05-17/slides.md` in Marp Preview (or `marp slides.md -o slides.pdf` if preference)
4. Open `presentations/auton-2026-05-17/speaker-notes.md` in a secondary window
5. Run **silent dry-run** of demo once. Verify clean exit.
6. Set Slack / Discord / Telegram to Do Not Disturb
7. Close every other browser tab. Memory pressure during the demo is the most common failure mode.

## 4. Live demo fallback

If the demo crashes mid-talk:

1. Stay calm, say once: `念のため、録画版に切り替えます`
2. Open `presentations/auton-2026-05-17/demo-recording.mp4` and play
3. Continue narration over the recording as if live (script is the same)
4. **Do not** debug live in front of the audience

If the recording also fails (host machine issues, projector lost signal):

1. Skip Slide 7 entirely
2. Say `デモは GitHub 上にコード一式置いてありますので、後ほどブラウザで再現していただけます`
3. Jump to Slide 8 (Why AUTON)
4. Recoup the 5 minutes in Q&A

## 5. Post-talk capture (within 60 min after speaking)

```bash
cd ~/Documents/dev/agentic-finance/autonomousfi
$EDITOR presentations/auton-2026-05-17/demo-recording.md
# Fill in: video URL, audience headcount, Q&A highlights, follow-up actions
git add presentations/auton-2026-05-17/demo-recording.md
git commit -m "docs(keynote): post-event capture from AUTON 2026-05-17"
git push
```

Then DM (社長 DM `1485538350155694161`) with one-paragraph immediate impression for memory continuity.

## 6. Failure modes to call out before stepping on stage

| Risk | Mitigation |
|---|---|
| Demo subprocess `pnpm` cold start over 10s | Recorded fallback in Section 4 |
| Projector loses HDMI mid-talk | Skip Slide 7, jump to 8, recoup in Q&A |
| Aggressive question on regulatory PoP (Worldcoin / zkPassport regional issues) | "Phase 4 で各地域パートナーを並行検討、AUTON 採択者と一緒に詰めたい" |
| Aggressive question on SaaS pivot timing | "Phase 4 GO/NO-GO は PMF signal threshold で判定。spec §12 に書いてある" |
| Aggressive question on competitive overlap with Visa Agent Pay etc | "B2C 決済とは別レーン。agent-to-agent P2P は構造的に違う問題領域" |
| Repo not yet public visible (DNS lag etc) | github.com/primebeat-inc/autonomousfi was pushed 2026-05-12; should propagate by 5/17 |

## 7. After the venue (evening)

- Memory save: append `presentations/auton-2026-05-17/demo-recording.md` content to `~/.claude/projects/-Users-shibuyaryuukyou/memory/project_autonomousfi_agent.md` (AUTON keynote results section)
- Sleep. Sprint 2 planning starts the following Monday.
