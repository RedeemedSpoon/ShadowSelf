import os
import requests

url = f"https://shadowself.io/api/email/delete-email/{os.environ['IDENTITY_ID']}"
response = requests.delete(
    url,
    headers={'Authorization': f"Bearer {os.environ['API_KEY']}"},
    json={'mailbox': 'INBOX', 'uid': 105}
)
print(response.text)
