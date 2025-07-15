import os
import requests

url = f"https://shadowself.io/api/email/send-email/{os.environ['IDENTITY_ID']}"
payload = {
    "to": "recipient@example.com",
    "subject": "API Test Email",
    "body": "This is the <b>HTML</b> body of the test email.",
    "inReplyTo": "<f0e9d8c7-b6a5-4321-fedc-ba0987654321@example.org>",
    "references": ["<f0e9d8c7-b6a5-4321-fedc-ba0987654321@example.org>"],
    "attachments": [{"filename": "document.pdf", "data": "JVBERi0xLjcK..."}],
    "draft": 123
}
response = requests.post(
    url,
    headers={'Authorization': f"Bearer {os.environ['API_KEY']}"},
    json=payload
)
print(response.text)
