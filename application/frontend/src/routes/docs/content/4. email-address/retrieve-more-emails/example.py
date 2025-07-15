import os
import requests

url = f"https://shadowself.io/api/email/load-more/{os.environ['IDENTITY_ID']}"
response = requests.get(
    url,
    headers={'Authorization': f"Bearer {os.environ['API_KEY']}"},
    params={'mailbox': 'INBOX', 'since': 104}
)
print(response.json())
