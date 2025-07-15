import os
import requests

url = f"https://shadowself.io/api/email/forward-email/{os.environ['IDENTITY_ID']}"
response = requests.post(
    url,
    headers={'Authorization': f"Bearer {os.environ['API_KEY']}"},
    json={'uid': 105, 'forward': 'forward.recipient@another.com'}
)
print(response.text)
