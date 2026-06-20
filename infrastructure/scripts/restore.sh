#!/usr/bin/env bash
# Coach"G" restore: download a backup from object storage and restore it.
# Usage: ./restore.sh coachg-20260620T020000Z.sql.gz
set -euo pipefail

FILE="${1:?Usage: restore.sh <backup-file.sql.gz>}"
: "${DATABASE_URL:?DATABASE_URL required}"
: "${S3_ENDPOINT:?S3_ENDPOINT required}"
: "${S3_BUCKET:?S3_BUCKET required}"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "[restore] downloading ${FILE}…"
AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY}" AWS_SECRET_ACCESS_KEY="${S3_SECRET_KEY}" \
aws --endpoint-url "${S3_ENDPOINT}" s3 cp "s3://${S3_BUCKET}/backups/${FILE}" "${TMP}/${FILE}"

echo "[restore] WARNING: this will overwrite data in the target database."
echo "[restore] target: ${DATABASE_URL%%\?*}"
read -r -p "Type 'restore' to continue: " confirm
[[ "$confirm" == "restore" ]] || { echo "aborted"; exit 1; }

echo "[restore] restoring…"
gunzip -c "${TMP}/${FILE}" | psql "$DATABASE_URL"
echo "[restore] done."
