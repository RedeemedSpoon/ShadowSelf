import os
import requests

url = f"https://shadowself.io/api/email/fetch-reply/{os.environ['IDENTITY_ID']}"
response = requests.get(
    url,
    headers={'Authorization': f"Bearer {os.environ['API_KEY']}"},
    params={'uuid': '<a1b2c3d4-e5f6-7890-1234-567890abcdef@shadowself.io>'}
)
print(response.json())
