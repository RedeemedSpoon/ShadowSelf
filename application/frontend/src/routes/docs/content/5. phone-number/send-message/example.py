import os
import requests

url = f"https://shadowself.io/api/phone/send-message/{os.environ['IDENTITY_ID']}"
payload = {
    "addressee": "+14155550000",
    "body": "Hello from the Python API script!"
}
response = requests.post(
    url,
    headers={'Authorization': f"Bearer {os.environ['API_KEY']}"},
    json=payload
)
print(response.json())
