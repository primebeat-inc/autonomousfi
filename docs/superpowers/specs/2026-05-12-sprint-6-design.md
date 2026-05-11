# Sprint 6 Design Doc: Phase 1 Closure + Tether Grant Wave Applications + Phase 2 Plan

**Date**: 2026-05-12
**Sprint Window**: 2026-07-21 to 2026-07-31 (11 days)
**Audience**: CEO, Lead Engineer (Makino), Lead Researcher (Sato), grant program managers
**Complements**: Phase 1 design spec (`docs/superpowers/specs/2026-05-11-autonomous-fi-agent-design.md`), Sprint 2 thru Sprint 5 docs, grant pursuit timeline (`docs/superpowers/specs/2026-05-12-grant-pursuit-timeline.md`)

## Sprint 6 Goal

Close Phase 1 by hitting all acceptance gates from spec sec 12, file 5 Tether grant wave applications, draft Phase 2 plan.

This is the seal-the-deal sprint. Phase 1 ends here. We push the open-source repo across the visibility threshold (30+ GitHub stars), submit the five individual Tether task applications that line up with our Phase 2 ambitions (USDT escrow, browser extension, QVAC SDK, docs, reference integration), get the EF PSE proposal out the door, and put a credible Phase 2 plan in writing. After this sprint we either have grant money headed our way or we have a clean go/no-go signal for the next strategic move.

No new code lands in this sprint outside of polish (README sweeps, demo recording tweaks, minor docs). Sprint 5 already delivered the PoP integration and the AUTON 5/17 keynote materials. Sprint 6 is execution on the visibility and funding side, plus written planning for Phase 2.

## Window

- **Start**: 2026-07-21 (Tuesday)
- **End**: 2026-07-31 (Friday)
- **Working days**: 9
- **Buffer**: 2 days for last-minute application review and resubmission if any of the Tether forms reject on format

## Sub-tasks

### 1. GitHub Stars Push

Goal: get the public repo from launch baseline to 30+ stars by 2026-07-31. We control the inputs (announcement quality, channel reach) and we will hit the target by saturating four channels in the same week.

- **Discord announcement**: Post in Prime Beat #general and #claude-code (channel IDs already in MEMORY.md). Frame: "Phase 1 of our open-source autonomous finance agent stack just shipped. Three contracts, PoP integration, MockChain SDK, full Foundry coverage. Star the repo if you want to follow Phase 2." Include screenshot of demo recording. Schedule 2026-07-22 morning.
- **X (Twitter) thread**: 8-tweet thread from @shibutatsu account. Tweet 1 hook on autonomous finance agents needing escrow with cheap-identity resistance. Tweets 2-6 walk through EscrowVault, HostageBond, ServiceMarketplace, PoP integration, MockChain swap. Tweet 7 link to demo video. Tweet 8 call to star the repo. Schedule 2026-07-23 around 9 AM JST so it lands during US wake-up.
- **Hacker News submission**: Submit as Show HN with title "Show HN: Open-source escrow + hostage-bond + reputation stack for AI agent commerce". Time the submission for 2026-07-24 around 14:00 UTC (sweet spot for HN front page). Pre-draft the first comment with technical context so we are ready to respond fast.
- **r/AgenticFinance announcement**: Cross-post a more technical version of the HN summary to the subreddit. Include the architecture diagram from the design doc. Schedule 2026-07-25.

Acceptance for this sub-task: 30+ GitHub stars verified via `gh api repos/...` by 2026-07-31. If we are under target by 2026-07-29 we trigger a second-wave Discord push to partner channels (Fracton, Next FinanceTech, AUTON Program participants).

### 2. Tether Next Wave Individual Task Applications

Tether's grant program accepts individual task applications rather than a single proposal. We file five, each scoped to a slice of our roadmap that benefits from Tether-aligned infrastructure work. Tracker doc lives in `docs/grants/tether-applications.md`.

Five applications to file by 2026-07-30:

1. **USDT escrow contract reference implementation**: Extend our EscrowVault to a USDT-specific reference deployment on Plasma mainnet. Scope: deploy, audit interaction with USDT's non-standard ERC20 quirks (no return value on transfer), publish integration guide. Budget ask: $30K. Timeline: 6 weeks post-funding.
2. **Browser extension for autonomous agent payments**: A Chrome/Brave extension that lets users approve agent payments from a wallet UI with hostage-bond visibility. Scope: MVP extension, integration with our SDK, demo with 3 sample tasks. Budget ask: $40K. Timeline: 8 weeks.
3. **QVAC SDK integration**: Tether's QVAC SDK plus our agent stack. Scope: write the bridge module so QVAC payment intents resolve through our EscrowVault, publish a sample dapp. Budget ask: $35K. Timeline: 6 weeks.
4. **Docs and developer onboarding**: Write production-grade docs for integrating USDT payments into autonomous agent workflows using our stack. Scope: 12+ pages of guides, 4 video walkthroughs, fully runnable code samples. Budget ask: $20K. Timeline: 4 weeks.
5. **Reference integration with a real DePIN protocol**: Pick a partner DePIN protocol from the AUTON cohort, integrate USDT-denominated escrow for their compute marketplace, publish the case study. Budget ask: $45K. Timeline: 10 weeks (partner-dependent).

Each application gets its own folder under `docs/grants/tether/` with a one-page proposal, milestone breakdown, and team assignment. Lead author: CEO. Technical review: Lead Engineer. Submit through the Tether portal once all five are reviewed internally.

### 3. EF PSE Proposal Submission

Ethereum Foundation Privacy & Scaling Explorations grant. Scope: zk-proven hostage-bond conditions. Our pitch is that PoP plus hostage works well today but reveals the bond value publicly. With a zk circuit we can prove hostage adequacy without revealing amounts, useful for high-value B2B agent transactions.

- **Proposal length**: 4 pages plus technical appendix
- **Asks**: $80K and 3-month engagement window
- **Deliverables in proposal**: zk circuit design, Solidity verifier integration, two reference deployments
- **Lead author**: Lead Researcher (Sato)
- **Internal review**: CEO + Lead Engineer
- **Submit by**: 2026-07-28
- **Expected response timeline**: 2 to 3 months from submission (EF PSE historically responds in this window)

Proposal lives at `docs/grants/ef-pse/proposal.md` with the appendix in the same folder.

### 4. Phase 2 Plan Draft via writing-plans Skill

Use the `superpowers:writing-plans` skill to draft `docs/superpowers/specs/2026-08-01-phase-2-plan.md`. The plan should be the contract for the next 3 to 4 months of work, regardless of which grants land.

Plan structure:

- **Phase 2 north star**: From open-source proof-of-concept to revenue-generating reference deployments
- **Three workstreams**: (a) audit-then-mainnet, (b) partner integrations and pilots, (c) developer ecosystem growth
- **Workstream a**: Engage audit firm (Sprint 7+), fix findings, deploy to Plasma mainnet, set up multi-sig governance
- **Workstream b**: Land 2 paid pilot integrations by Phase 2 end, each $50K-$150K, ideally with AUTON cohort members
- **Workstream c**: Hit 100+ GitHub stars, 20+ external contributors, monthly developer office hours
- **Decision gates**: 2026-08-15 audit firm selection, 2026-09-15 first pilot signed, 2026-10-15 mainnet deploy
- **Resourcing**: Lead Engineer 80% allocation, Lead Researcher 40% allocation, CEO 30% allocation
- **Budget envelope**: $200K total (audit $100K, dev work $80K, ops $20K)
- **Grant dependencies**: If Tether grants land we accelerate workstream b. If EF PSE lands we add a zk-hostage workstream. If neither lands we still execute on workstream a with internal funding.

Plan must be committed to the repo by 2026-07-31.

## Acceptance Gates

All gates must be green to call Sprint 6 complete:

1. **Phase 1 gates 1 through 11 (from main spec)**: All green. This means contracts deployed and verified on Plasma testnet, PoP integration documented, SDK swap to chain demo working, MockChain parity tests passing, demo recording committed, README polished, license set, security policy committed, code of conduct present, contributing guide written, issue templates in place. Verify each gate by checking the file or running the test.
2. **Repo public with 30+ GitHub stars**: Verify with `gh api repos/<owner>/<repo> --jq .stargazers_count` returning a number 30 or greater.
3. **5 Tether tasks filed**: Each application has a confirmation receipt or screenshot stored under `docs/grants/tether/<task-name>/receipt.png`. All five submitted before 2026-07-30 23:59 JST.
4. **EF PSE proposal submitted**: Confirmation email or portal screenshot stored under `docs/grants/ef-pse/submission-receipt.png`. Response timeline of 2 to 3 months noted in the receipt log.
5. **Phase 2 plan committed to repo**: File exists at `docs/superpowers/specs/2026-08-01-phase-2-plan.md`, committed and pushed, with all four sections from sub-task 4 populated.

## Out of Scope

- **Audit firm engagement**: Deferred to Sprint 7+, conditional on grant funding. We will request quotes from 3 firms (likely OpenZeppelin, Trail of Bits, Code4rena cohort) during Sprint 6 but will not sign a contract until we know our funding position.
- **Phase 2 implementation work**: Belongs to the next sprint cycle. Sprint 6 only produces the Phase 2 plan document, not code.
- **New contract development**: No new Solidity contracts in this sprint. Only the three from Sprint 2 plus the PoP wiring from Sprint 5.
- **Mainnet deployment**: Stays in Phase 2 workstream a.
- **Token launch or fundraising**: Not in scope for this stack. We are building infrastructure, not issuing tokens.

## Dependencies

- **Sprint 5 PoP integration complete**: Must have ERC-8004 reference impl wired through HostageBond minimum-bond calculation. Verified by Sprint 5 acceptance gates. If incomplete, Sprint 6 cannot launch announcements with accurate technical claims.
- **AUTON 5/17 keynote done**: CEO presentation at AUTON Program kickoff finished and feedback collected. We will reference AUTON cohort partnerships in the announcements and the Tether reference-integration application.
- **Demo recording committed**: Must be in the repo at `demos/phase-1-walkthrough.mp4` (or linked YouTube unlisted URL in README) before the 2026-07-22 Discord announcement. Sprint 5 should have produced this; if not, Sprint 6 Day 1 is recording day.
- **GitHub repo public**: Confirmed public before announcement push. Verify by visiting in incognito.
- **Tether portal access**: CEO account confirmed working on the grant submission portal. If credentials are stale, reset before 2026-07-25.

## Risks and Mitigations

- **Risk**: 30 stars target not hit by 2026-07-31. **Mitigation**: Second-wave Discord push on 2026-07-29 to partner servers; if still short, extend the gate by 2 weeks rather than declare failure. Stars are a vanity metric, but they correlate with grant evaluator perception.
- **Risk**: Tether portal rejects one or more applications on format. **Mitigation**: 2-day buffer at the end of the sprint window. Pre-validate each application against the public Tether grant rubric before submission.
- **Risk**: EF PSE proposal misses 2026-07-28 deadline due to circuit design taking longer than expected. **Mitigation**: Sato starts drafting the circuit appendix on 2026-07-21 in parallel with CEO drafting the main proposal narrative. If circuit design is not converged by 2026-07-26, submit with a stub design plus commitment to deliver in week 1 of the engagement.
- **Risk**: Phase 2 plan draft slips because grant outcomes are uncertain. **Mitigation**: The plan explicitly covers three scenarios (Tether lands, EF lands, neither lands). Uncertainty is a feature of the plan, not a blocker.

## Effort Estimate

Using MAX $200 plan x Effort High of 5-hour daily limit as the unit:

- GitHub stars push (announcements + monitoring): ~30% of one session per day x 5 days = 1.5 sessions equivalent
- Tether 5 applications drafting + review + submit: ~80% of one session x 5 days = 4 sessions equivalent
- EF PSE proposal: ~60% of one session x 4 days = 2.4 sessions equivalent
- Phase 2 plan draft: ~50% of one session x 3 days = 1.5 sessions equivalent
- Buffer + coordination: 1 session equivalent

Total: ~10 sessions equivalent across CEO + Lead Researcher + Lead Engineer time. Realistic for a 9-day window with 2-day buffer.

## Definition of Done

Sprint 6 is complete when:

1. All 5 acceptance gates above are green and verifiable
2. A handover note is appended to `docs/superpowers/HANDOVER.md` with links to the 5 Tether receipts, the EF PSE receipt, the announcement post URLs, and the Phase 2 plan
3. CEO holds a 30-minute internal review with Lead Engineer and Lead Researcher to confirm Phase 2 plan resourcing is realistic
4. A VOICEVOX completion notification fires: "Sprint 6 が完了したのだ! Phase 1 はクローズで Phase 2 計画もコミット済みなのだ!"

End of Sprint 6 design doc.
