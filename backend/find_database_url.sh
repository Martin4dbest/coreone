#!/usr/bin/env bash

echo "========== Current directory =========="
pwd

echo
echo "========== .env files =========="
find . -type f -name ".env"

echo
echo "========== DATABASE_URL occurrences =========="
grep -RIn "DATABASE_URL" . 2>/dev/null

echo
echo "========== sslmode occurrences =========="
grep -RIn "sslmode" . 2>/dev/null

echo
echo "========== channel_binding occurrences =========="
grep -RIn "channel_binding" . 2>/dev/null

echo
echo "========== app/core/config.py =========="
if [ -f app/core/config.py ]; then
    sed -n '1,200p' app/core/config.py
fi

echo
echo "========== app/db/database.py =========="
if [ -f app/db/database.py ]; then
    sed -n '1,200p' app/db/database.py
fi
