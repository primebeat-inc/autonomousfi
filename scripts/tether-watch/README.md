# tether.dev watcher

Daily diff watcher for the Tether developer grants page. Alerts on any HTML change (new task, deadline change, status change, page refresh).

## Why this exists

Tether grants do not publish a wave schedule or review timeline. We poll the public page daily so AutonomousFi maintainers (Prime Beat) can react within 24 hours of a new task posting or a deadline change.

## Quick start

```bash
# 1. Capture initial baseline (already done during script setup)
./watch.sh init

# 2. Run a single check manually
./watch.sh check

# 3. View recent activity log
./watch.sh log
```

## Daily automation (macOS launchd)

```bash
# Install
cp com.primebeat.tether-watch.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.primebeat.tether-watch.plist

# Verify
launchctl list | grep tether-watch

# Inspect log
tail -f ~/.cache/tether-watch/watch.log
```

The job runs at 09:00 JST daily.

## Optional Discord webhook

To pipe diffs to a Discord channel (for example the social DM channel for Prime Beat CEO):

```bash
# Create a Discord webhook in the target channel's settings, then:
export TETHER_WATCH_DISCORD_WEBHOOK='https://discord.com/api/webhooks/.../...'
./watch.sh check
```

To make persistent in launchd, add a `<key>EnvironmentVariables</key>` entry inside the plist.

## What changes trigger an alert

Any byte-level change to the fetched HTML. Concretely this covers:

- New grant task added (most likely future event)
- Existing task deadline changed
- Existing task status flip from "Open" to "Closed" / "Accepted" / "Submissions Under Review"
- Bounty amount changed
- New category added (e.g., a Pears or MDK task)
- Page rebranded or restructured

False positives possible from cache-busting query strings or analytics; the diff log shows the actual change so noise is filterable.

## Output locations

- Baseline / current HTML: `~/.cache/tether-watch/{baseline,current}.html`
- Diff log: `~/.cache/tether-watch/watch.log`
- launchd stdout/stderr: `~/.cache/tether-watch/launchd.{stdout,stderr}.log`

## Brand rule

This README follows the project brand rule: no em dashes, no Web3 / Web2 terminology.
