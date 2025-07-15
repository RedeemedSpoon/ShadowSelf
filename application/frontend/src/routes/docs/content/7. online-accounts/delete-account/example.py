import os
import requests

url = f"https://shadowself.io/api/account/delete-account/{os.environ['IDENTITY_ID']}"
response = requests.delete(
    url,
    headers={'Authorization': f"Bearer {os.environ['API_KEY']}"},
    json={'id': 103}
)
print(response.text)
