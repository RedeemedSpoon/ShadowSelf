import os
import requests

url = f"https://shadowself.io/api/crypto/broadcast/{os.environ['IDENTITY_ID']}"
response = requests.post(
    url,
    headers={'Authorization': f"Bearer {os.environ['API_KEY']}"},
    json={'hex': '0200000001...', 'coin': 'btc'}
)
print(response.json())