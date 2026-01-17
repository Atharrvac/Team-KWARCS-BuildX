#!/bin/bash

echo "Testing Contract Creation..."
echo ""

# Test contract creation
echo "1. Creating a new contract..."
curl -X POST http://localhost:3001/api/contracts/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "crop": "soybean",
    "quantity": 10,
    "lockedPrice": 4500,
    "expiryDate": "2025-03-01"
  }' | jq '.'

echo ""
echo ""

# Get notifications
echo "2. Checking notifications..."
curl http://localhost:3001/api/notifications/1 | jq '.notifications[0:3]'

echo ""
echo ""

# Get unread count
echo "3. Getting unread count..."
curl http://localhost:3001/api/notifications/1/unread/count | jq '.'

echo ""
echo "Test complete!"
