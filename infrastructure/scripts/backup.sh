#!/usr/bin/env bash
# Coach"G" database backup: pg_dump → gzip → ArvanCloud Object Storage (S3-compatible).
# Schedule via cron, e.g.:  0 2 * * *  /app/infrastructure/scripts/backup.sh
#
# Required env: DATABASE_URL, S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY
# Requires: pg_dump, aws CLI (used purely as an S3-compatible client).
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL required}"
: "${S3_ENDPOINT:?S3_ENDPOINT required}"
: "${S3_BUCKET:?S3_BUCKET required}"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="coachg-${STAMP}.sql.gz"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "[backup] dumping database…"
pg_dump "$DATABASE_URL" --no-owner --no-privileges | gzip > "${TMP}/${FILE}"

echo "[backup] uploading ${FILE} to s3://${S3_BUCKET}/backups/"
AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY}" \
AWS_SECRET_ACCESS_KEY="${S3_SECRET_KEY}" \
aws --endpoint-url "${S3_ENDPOINT}" s3 cp "${TMP}/${FILE}" "s3://${S3_BUCKET}/backups/${FILE}"

# Retain last 30 days; prune older objects.
echo "[backup] pruning backups older than 30 days…"
CUTOFF="$(date -u -d '30 days ago' +%Y%m%d 2>/dev/null || date -u -v-30d +%Y%m%d)"
AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY}" AWS_SECRET_ACCESS_KEY="${S3_SECRET_KEY}" \
aws --endpoint-url "${S3_ENDPOINT}" s3 ls "s3://${S3_BUCKET}/backups/" | awk '{print $4}' | while read -r key; do
  d="$(echo "$key" | sed -E 's/coachg-([0-9]{8}).*/\1/')"
  if [[ "$d" =~ ^[0-9]{8}$ && "$d" < "$CUTOFF" ]]; then
    AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY}" AWS_SECRET_ACCESS_KEY="${S3_SECRET_KEY}" \
    aws --endpoint-url "${S3_ENDPOINT}" s3 rm "s3://${S3_BUCKET}/backups/${key}"
  fi
done

echo "[backup] done: ${FILE}"
