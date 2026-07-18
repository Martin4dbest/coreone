#!/usr/bin/env bash

echo "===== app/db/database.py ====="
sed -n '1,120p' app/db/database.py

echo
echo "===== Search for create_async_engine ====="
grep -RIn "create_async_engine" .

echo
echo "===== Search for connect_args ====="
grep -RIn "connect_args" .

echo
echo "===== Search for sslmode ====="
grep -RIn "sslmode" .

echo
echo "===== Search for create_engine ====="
grep -RIn "create_engine" .
