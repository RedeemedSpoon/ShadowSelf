import os
import requests

url = f"https://shadowself.io/api/phone/fetch-conversation/{os.environ['IDENTITY_ID']}"
response = requests.get(
    url,
    headers={'Authorization': f"Bearer {os.environ['API_KEY']}"},
    params={'addressee': '+14155550000'}
)
print(response.json())
