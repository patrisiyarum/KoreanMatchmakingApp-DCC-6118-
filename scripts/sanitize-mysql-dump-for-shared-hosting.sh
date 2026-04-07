#!/usr/bin/env bash
# Remove replication/binlog statements that need SUPER or BINLOG ADMIN (shared hosting).
# Matches mysqldump output like: /*!80003 SET @@SESSION.SQL_LOG_BIN = 0 */
# Usage:
#   chmod +x scripts/sanitize-mysql-dump-for-shared-hosting.sh
#   ./scripts/sanitize-mysql-dump-for-shared-hosting.sh dump.sql > dump-shared.sql
set -euo pipefail
if [[ $# -lt 1 ]] || [[ ! -f "$1" ]]; then
  echo "Usage: $0 <mysql-dump.sql>" >&2
  exit 1
fi
sed \
  -e '/@@SESSION\.SQL_LOG_BIN/d' \
  -e '/@@GLOBAL\.GTID_PURGED/d' \
  -e '/@@SESSION\.GTID_NEXT/d' \
  "$1"
