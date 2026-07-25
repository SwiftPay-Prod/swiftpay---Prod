#!/bin/bash
set -e

BACKUP_DIR=${BACKUP_DIR:-/root/swiftpay/backups}
RETENTION_DAYS=${RETENTION_DAYS:-7}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
COMPOSE_FILE=${COMPOSE_FILE:-/root/swiftpay/swiftpay-api/docker-compose.production.yaml}

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting backup..."

# Backup swiftpay database
echo "Backing up swiftpaydb..."
docker exec swiftpaydb pg_dump -U swiftpayuser swiftpay | gzip > "${BACKUP_DIR}/swiftpay_${TIMESTAMP}.sql.gz"
echo "  -> swiftpaydb: ${BACKUP_DIR}/swiftpay_${TIMESTAMP}.sql.gz ($(du -h "${BACKUP_DIR}/swiftpay_${TIMESTAMP}.sql.gz" | cut -f1))"

# Backup swiftpaylogs database
echo "Backing up swiftpaylogsdb..."
docker exec swiftpaylogsdb pg_dump -U logsuser swiftpaylogs | gzip > "${BACKUP_DIR}/swiftpaylogs_${TIMESTAMP}.sql.gz"
echo "  -> swiftpaylogsdb: ${BACKUP_DIR}/swiftpaylogs_${TIMESTAMP}.sql.gz ($(du -h "${BACKUP_DIR}/swiftpaylogs_${TIMESTAMP}.sql.gz" | cut -f1))"

# Remove old backups
echo "Cleaning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "swiftpay_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
find "${BACKUP_DIR}" -name "swiftpaylogs_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

echo "[$(date)] Backup complete."
