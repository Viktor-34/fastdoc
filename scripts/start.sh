#!/bin/sh
set -eu

# Trim common copy/paste artifacts from DATABASE_URL in hosting UIs.
sanitize_database_url() {
  raw="${DATABASE_URL:-}"
  cleaned="$(
    printf '%s' "$raw" \
      | tr -d '\r' \
      | sed \
          -e "s/^psql[[:space:]]*//" \
          -e "s/^'//" \
          -e "s/'$//" \
          -e 's/^"//' \
          -e 's/"$//'
  )"
  DATABASE_URL="$cleaned"
  export DATABASE_URL
}

validate_database_url() {
  node - <<'NODE'
const raw = process.env.DATABASE_URL || "";
try {
  const url = new URL(raw);
  if (!url.port || !/^[0-9]+$/.test(url.port)) {
    throw new Error(`Invalid port "${url.port}"`);
  }
  const db = url.pathname.replace(/^\//, "");
  console.log(`[startup] DATABASE_URL parsed: host=${url.hostname} port=${url.port} db=${db}`);
} catch {
  console.error("[startup] Invalid DATABASE_URL format. Update DATABASE_URL in App Platform variables.");
  process.exit(1);
}
NODE
}

sanitize_database_url
validate_database_url

run_migrations() {
  if [ "${RUN_PRISMA_MIGRATIONS:-true}" != "true" ]; then
    echo "[startup] RUN_PRISMA_MIGRATIONS=false, skipping prisma migrate deploy"
    return 0
  fi

  timeout_seconds="${PRISMA_MIGRATE_TIMEOUT_SECONDS:-45}"
  migrate_failed=0

  echo "[startup] Running prisma migrate deploy (timeout: ${timeout_seconds}s)"
  if command -v timeout >/dev/null 2>&1; then
    timeout "$timeout_seconds" npx prisma migrate deploy || migrate_failed=1
  else
    npx prisma migrate deploy || migrate_failed=1
  fi

  if [ "$migrate_failed" -ne 0 ]; then
    if [ "${PRISMA_MIGRATE_STRICT:-false}" = "true" ]; then
      echo "[startup] prisma migrate deploy failed and PRISMA_MIGRATE_STRICT=true, exiting"
      exit 1
    fi
    echo "[startup] Warning: prisma migrate deploy failed, continuing app startup"
  fi
}

run_migrations
exec npm run start
