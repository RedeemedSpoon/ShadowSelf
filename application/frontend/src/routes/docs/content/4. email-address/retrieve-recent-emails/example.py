import os
import requests

url = f"https://shadowself.io/api/email/{os.environ['IDENTITY_ID']}"
response = requests.get(
    url,
    headers={
        'Authorization': f"Bearer {os.environ['API_KEY']}",
        'Accept': 'application/json'
    }
)
print(response.json())
