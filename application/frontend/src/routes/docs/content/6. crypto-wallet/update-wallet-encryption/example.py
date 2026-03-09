import os
import requests

url = f"https://shadowself.io/api/crypto/update-encryption/{os.environ['IDENTITY_ID']}"
response = requests.put(
    url,
    headers={'Authorization': f"Bearer {os.environ['API_KEY']}"},
    json={'blob': 'U2FsdGVkX19nb...','keys': {"address": "YH5eD5e2T..."}}
)
print(response.json())
