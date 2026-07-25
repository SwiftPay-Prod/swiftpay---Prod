#!/bin/bash
set -e

if [ $# -lt 2 ]; then
  echo "Usage: $0 <database> <backup-file>"
  echo "  database: swiftpay | swiftpaylogs"
  echo "  backup-file: path to .sql.gz file"
  exit 1
fi

DB=$1
FILE=$2

if [ ! -f "$FILE" ]; then
  echo "Error: Backup file not found: $FILE"
  exit 1
fi

case $DB in
  swiftpay)
    echo "Restoring swiftpaydb from $FILE..."
    gunzip -c "$FILE" | docker exec -i swiftpaydb psql -U swiftpayuser swiftpay
    echo "Done."
    ;;
  swiftpaylogs)
    echo "Restoring swiftpaylogsdb from $FILE..."
    gunzip -c "$FILE" | docker exec -i swiftpaylogsdb psql -U logsuser swiftpaylogs
    echo "Done."
    ;;
  *)
    echo "Error: Unknown database '$DB'. Use swiftpay or swiftpaylogs."
    exit 1
    ;;
esac
