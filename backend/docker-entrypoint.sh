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
  kill -TERM "$scheduler_pid" 2>/dev/null || true
  kill -TERM "$hubspot_pid" 2>/dev/null || true
}

trap term_handler INT TERM

# Monitor all processes; if any exits, shut down the others.
while :; do
  if ! kill -0 "$api_pid" 2>/dev/null; then
    term_handler
    wait "$scheduler_pid" 2>/dev/null || true
    wait "$hubspot_pid" 2>/dev/null || true
    exit 1
  fi
  if [ -n "$scheduler_pid" ] && ! kill -0 "$scheduler_pid" 2>/dev/null; then
    term_handler
    wait "$api_pid" 2>/dev/null || true
    wait "$hubspot_pid" 2>/dev/null || true
    exit 1
  fi
  if [ -n "$hubspot_pid" ] && ! kill -0 "$hubspot_pid" 2>/dev/null; then
    term_handler
    wait "$api_pid" 2>/dev/null || true
    wait "$scheduler_pid" 2>/dev/null || true
    exit 1
  fi
  sleep 5
done
