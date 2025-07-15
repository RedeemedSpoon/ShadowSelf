import os
import requests

url = f"https://shadowself.io/api/identity/update/{os.environ['IDENTITY_ID']}"
response = requests.put(
    url,
    headers={'Authorization': f"Bearer {os.environ['API_KEY']}"},
    json={'name': 'Jane Doe', 'age': 33}
)
print(response.json())
