curl -X POST "https://shadowself.io/api/crypto/swap-trades/$IDENTITY_ID" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $API_KEY" \
     -d '{
           "tradeID": "trade_12345",
           "coinTo": "xmr",
           "coinFrom": "btc",
           "amount": 0.01,
           "destinationAddress": "44AFFq...",
           "refundAddress": "bc1q...",
           "provider": "ProviderA",
           "isFixed": false
         }'