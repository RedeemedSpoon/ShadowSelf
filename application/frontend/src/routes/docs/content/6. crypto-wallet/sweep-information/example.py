import os
import requests

url = f"https://shadowself.io/api/crypto/sweep-info/{os.environ['IDENTITY_ID']}"
response = requests.post(
    url,
    headers={'Authorization': f"Bearer {os.environ['API_KEY']}"},
    json={'coin': 'btc', 'addresses': ['bc1q...', 'bc1p...']}
)
print(response.json())