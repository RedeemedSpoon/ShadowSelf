import os
import requests

response = requests.get(
    "https://shadowself.io/api/",
    headers={
        'Authorization': f"Bearer {os.environ['API_KEY']}",
        'Accept': 'application/json'
    }
)
print(response.json())
