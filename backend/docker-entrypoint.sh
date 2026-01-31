#!/bin/sh
set -e

# Start attestation scheduler as a separate process unless disabled.
scheduler_pid=""
if [ "${RUN_ATTESTATION_SCHEDULER:-true}" != "false" ]; then
  node services/attestationScheduler.js &
  scheduler_pid=$!
fi

# Start HubSpot scheduler as a separate process unless disabled.
hubspot_pid=""
if [ "${RUN_HUBSPOT_SCHEDULER:-true}" != "false" ]; then
  node services/hubspotScheduler.js &
  hubspot_pid=$!
fi

# Start API server.
node server.js &
api_pid=$!

term_handler() {
  kill -TERM "$api_pid" 2>/dev/null || true
  [ -n "$scheduler_pid" ] && kill -TERM "$scheduler_pid" 2>/dev/null || true
  [ -n "$hubspot_pid" ] && kill -TERM "$hubspot_pid" 2>/dev/null || true
}

trap term_handler INT TERM

# Restart a scheduler process after a delay to avoid rapid restart loops.
restart_scheduler() {
  local name="$1"
  local script="$2"
  echo "WARNING: $name exited unexpectedly, restarting in 30s..." >&2
  sleep 30
  node "$script" &
  echo $!
}

# Monitor all processes.
# If the API server exits, shut down everything.
# If a scheduler exits, restart it automatically.
while :; do
  if ! kill -0 "$api_pid" 2>/dev/null; then
    echo "ERROR: API server (PID $api_pid) exited, shutting down container" >&2
    term_handler
    wait "$scheduler_pid" 2>/dev/null || true
    wait "$hubspot_pid" 2>/dev/null || true
    exit 1
  fi

  if [ -n "$scheduler_pid" ] && ! kill -0 "$scheduler_pid" 2>/dev/null; then
    scheduler_pid=$(restart_scheduler "Attestation scheduler" "services/attestationScheduler.js")
  fi

  if [ -n "$hubspot_pid" ] && ! kill -0 "$hubspot_pid" 2>/dev/null; then
    hubspot_pid=$(restart_scheduler "HubSpot scheduler" "services/hubspotScheduler.js")
  fi

  sleep 5
done
