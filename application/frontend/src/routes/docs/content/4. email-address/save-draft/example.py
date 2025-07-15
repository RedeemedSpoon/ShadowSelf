import os
import requests

url = f"https://shadowself.io/api/email/save-draft/{os.environ['IDENTITY_ID']}"
payload = {
    "to": "recipient@example.com",
    "subject": "Updated Draft Subject",
    "body": "Continuing to write this email...",
    "attachments": [{"filename": "idea.txt", "data": "VGhpcyBpcyBteSB..."}],
    "draft": 45
}
response = requests.put(
    url,
    headers={'Authorization': f"Bearer {os.environ['API_KEY']}"},
    json=payload
)
print(response.json())
