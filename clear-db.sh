#!/bin/bash

# Clear database script for DesignKorv before deployment
# Warning: This script will DELETE ALL DATA from your database

echo "WARNING: This script will DELETE ALL DATA from your database."
echo "This is meant for preparing a clean deployment."
echo "Make sure you have a backup if you need to preserve any data."
echo ""
read -p "Are you sure you want to continue? (y/n): " confirm

if [ "$confirm" != "y" ]; then
  echo "Operation canceled."
  exit 1
fi

# Execute the clear-database.js script
echo "Clearing database..."
node clear-database.js

echo "Database cleared successfully."
echo "Your database is now ready for a fresh deployment."