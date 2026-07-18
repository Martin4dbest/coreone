#!/usr/bin/env bash

echo "========== app/db/database.py =========="
sed -n '1,200p' app/db/database.py

echo
echo "========== app/core/config.py =========="
sed -n '1,200p' app/core/config.py
