#!/bin/bash
echo -e "\033[1;33mDesignKorv Database Cleanup Utility\033[0m"
echo -e "\033[1;33m--------------------------------\033[0m"
echo ""
echo -e "\033[0;31mThis will remove all example/demo data from the database.\033[0m"
echo "Products, orders, categories, and cart items will be deleted."
echo ""
echo -n "Do you want to proceed? (y/N): "
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])+$ ]]
then
    echo ""
    echo "Running database clearing script with confirmation..."
    npx tsx clear-database.js --confirm
    echo ""
    echo -e "\033[1;32mDatabase cleanup completed.\033[0m"
else
    echo ""
    echo -e "\033[1;31mOperation cancelled. No data was deleted.\033[0m"
fi
