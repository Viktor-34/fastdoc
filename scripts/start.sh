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

npx prisma migrate deploy
npm run start
