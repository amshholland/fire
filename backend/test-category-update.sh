#!/bin/bash
# Manual test script for transaction category update feature
# Run this after restarting the backend server

echo "Testing Transaction Category Update Feature"
echo "==========================================="
echo ""

BASE_URL="http://localhost:3030/api"
TRANSACTION_ID="txn-demo-0"
USER_ID="user-demo"

echo "1. Testing successful category update..."
curl -s -X PUT "$BASE_URL/transactions/$TRANSACTION_ID/category" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\", \"category_id\": 2}" | jq '.'
echo ""

echo "2. Testing validation error (invalid category)..."
curl -s -X PUT "$BASE_URL/transactions/$TRANSACTION_ID/category" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\", \"category_id\": 999}" | jq '.'
echo ""

echo "3. Testing validation error (negative category)..."
curl -s -X PUT "$BASE_URL/transactions/$TRANSACTION_ID/category" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\", \"category_id\": -1}" | jq '.'
echo ""

echo "4. Testing missing parameter error..."
curl -s -X PUT "$BASE_URL/transactions/$TRANSACTION_ID/category" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\"}" | jq '.'
echo ""

echo "5. Testing transaction not found error..."
curl -s -X PUT "$BASE_URL/transactions/txn-nonexistent/category" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\", \"category_id\": 1}" | jq '.'
echo ""

echo "6. Testing authorization (wrong user)..."
curl -s -X PUT "$BASE_URL/transactions/$TRANSACTION_ID/category" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"user-other\", \"category_id\": 1}" | jq '.'
echo ""

echo "Manual tests complete!"
echo "Note: Restart the backend server (npm run start:backend) if the endpoint returns 404"
