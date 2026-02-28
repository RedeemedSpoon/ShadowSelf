import os
import requests

url = f"https://shadowself.io/api/crypto/xmr-node/{os.environ['IDENTITY_ID']}"
response = requests.get(
    url,
    headers={'Authorization': f"Bearer {os.environ['API_KEY']}"}
)
print(response.json())