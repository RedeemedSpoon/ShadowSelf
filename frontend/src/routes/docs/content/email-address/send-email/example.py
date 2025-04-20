import os
import requests
import json
import base64

# Requires API_KEY and IDENTITY_ID environment variables
api_key = os.environ.get('API_KEY')
identity_id = os.environ.get('IDENTITY_ID')

if not api_key or not identity_id:
    print("Error: API_KEY and IDENTITY_ID env vars must be set.")
    exit(1)

api_url = f"https://shadowself.io/api/email/send-email/{identity_id}"

headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

pdf_data = "JVBERi0xLjcK..."

payload = {
    "to": "recipient@example.com",
    "subject": "API Test Email",
    "body": "This is the <b>HTML</b> body of the test email.",
    "inReplyTo": "<f0e9d8c7-b6a5-4321-fedc-ba0987654321@example.org>",
    "references": ["<f0e9d8c7-b6a5-4321-fedc-ba0987654321@example.org>"],
    "attachments": [
        {
         "filename": "document.pdf",
         "data": pdf_data
        }
    ],
    "draft": 123
}

try:
    response = requests.post(api_url, headers=headers, json=payload)
    response.raise_for_status()
    print(json.dumps(response.json(), indent=2))
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
except Exception as e:
    print(f"An error occurred: {e}")
