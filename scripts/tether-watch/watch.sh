#!/usr/bin/env bash
# Watch tether.dev for grant task changes (new task, deadline change, status change).
# Designed to run daily via launchd or cron.
#
# On any diff: log to .tether-watch.log AND macOS notification AND (if configured)
# Discord DM via webhook.
#
# Setup:
#   1. Run once to capture baseline:
#        ./watch.sh init
#   2. Run periodically:
#        ./watch.sh
#   3. Inspect history:
#        ./watch.sh log

set -euo pipefail

CACHE_DIR="${TETHER_WATCH_CACHE:-$HOME/.cache/tether-watch}"
BASELINE="$CACHE_DIR/baseline.html"
CURRENT="$CACHE_DIR/current.html"
LOG_FILE="$CACHE_DIR/watch.log"
URL="${TETHER_WATCH_URL:-https://tether.dev}"
DISCORD_WEBHOOK="${TETHER_WATCH_DISCORD_WEBHOOK:-}"

mkdir -p "$CACHE_DIR"

cmd_init() {
  curl -sL "$URL" -o "$BASELINE"
  echo "[$(date -Iseconds)] init baseline ($(wc -l <"$BASELINE") lines)" | tee -a "$LOG_FILE"
}

cmd_log() {
  tail -50 "$LOG_FILE" 2>/dev/null || echo "(no log yet)"
}

cmd_check() {
  curl -sL "$URL" -o "$CURRENT"
  if [ ! -f "$BASELINE" ]; then
    echo "No baseline. Run: $0 init" >&2
    exit 1
  fi

  if diff -q "$BASELINE" "$CURRENT" > /dev/null; then
    echo "[$(date -Iseconds)] no change" >> "$LOG_FILE"
    exit 0
  fi

  # Change detected.
  local diff_summary
  diff_summary=$(diff "$BASELINE" "$CURRENT" | head -100)

  {
    echo "[$(date -Iseconds)] CHANGE DETECTED on $URL"
    echo "----- diff (first 100 lines) -----"
    echo "$diff_summary"
    echo "----- end diff -----"
  } >> "$LOG_FILE"

  # macOS notification (no-op on Linux)
  if command -v osascript >/dev/null 2>&1; then
    osascript -e 'display notification "tether.dev changed. Check '"$LOG_FILE"'" with title "Tether grant watcher" sound name "Glass"' || true
  fi

  # Discord webhook (optional)
  if [ -n "$DISCORD_WEBHOOK" ]; then
    local msg
    msg=$(printf 'tether.dev changed at %s. Diff sample:\n```\n%s\n```' "$(date -Iseconds)" "$(echo "$diff_summary" | head -20)")
    curl -sS -X POST -H 'Content-Type: application/json' \
      -d "$(jq -n --arg c "$msg" '{content: $c}')" \
      "$DISCORD_WEBHOOK" >/dev/null || true
  fi

  # Promote current to new baseline so we only alert on next change
  cp "$CURRENT" "$BASELINE"

  echo "Change detected. Log at: $LOG_FILE"
  exit 0
}

case "${1:-check}" in
  init)  cmd_init ;;
  log)   cmd_log ;;
  check) cmd_check ;;
  *)     echo "Usage: $0 {init|check|log}" >&2 ; exit 1 ;;
esac
