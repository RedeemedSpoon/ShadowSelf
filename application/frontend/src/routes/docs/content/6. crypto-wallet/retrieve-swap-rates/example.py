import os
import requests

url = f"https://shadowself.io/api/crypto/swap-rates/{os.environ['IDENTITY_ID']}"
response = requests.get(
    url,
    params={'coinFrom': 'btc', 'coinTo': 'xmr', 'amount': 0.01},
    headers={'Authorization': f"Bearer {os.environ['API_KEY']}"}
)
print(response.json())