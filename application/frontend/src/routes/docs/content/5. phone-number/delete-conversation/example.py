import os
import requests

url = f"https://shadowself.io/api/phone/delete-conversation/{os.environ['IDENTITY_ID']}"
response = requests.delete(
    url,
    headers={'Authorization': f"Bearer {os.environ['API_KEY']}"},
    json={'addressee': '+14155550000'}
)
print(response.text)
