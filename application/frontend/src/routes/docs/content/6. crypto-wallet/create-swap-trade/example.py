import os
import requests

url = f"https://shadowself.io/api/crypto/swap-trades/{os.environ['IDENTITY_ID']}"
payload = {
    'tradeID': 'trade_12345',
    'coinTo': 'xmr',
    'coinFrom': 'btc',
    'amount': 0.01,
    'destinationAddress': '44AFFq...',
    'refundAddress': 'bc1q...',
    'provider': 'ProviderA',
    'isFixed': False
}
response = requests.post(
    url,
    headers={'Authorization': f"Bearer {os.environ['API_KEY']}"},
    json=payload
)
print(response.json())