#!/usr/bin/env bash
# Local CD: if Next is not already up on :3000, start the production server (needs a prior build).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PORT="${FRONTEND_PORT:-3000}"
URL="http://127.0.0.1:${PORT}"
RUN_DIR="$ROOT/.local-run"
mkdir -p "$RUN_DIR"

if curl -sf --max-time 2 "$URL" >/dev/null; then
  echo "==> [frontend] already healthy at $URL"
  exit 0
fi

if [[ ! -d .next ]]; then
  echo "==> [frontend] no .next build; running npm run build"
  npm run build
fi

echo "==> [frontend] starting next start on :${PORT}"
nohup npm run start -- --hostname 127.0.0.1 --port "$PORT" \
  >"$RUN_DIR/frontend.log" 2>&1 &
echo $! >"$RUN_DIR/frontend.pid"

for _ in $(seq 1 40); do
  if curl -sf --max-time 1 "$URL" >/dev/null; then
    echo "==> [frontend] healthy at $URL (pid $(cat "$RUN_DIR/frontend.pid"))"
    exit 0
  fi
  sleep 1
done

echo "frontend failed to become healthy. Last log:" >&2
tail -n 40 "$RUN_DIR/frontend.log" >&2
exit 1
