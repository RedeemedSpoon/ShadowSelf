import os
import requests

url = f"https://shadowself.io/api/identity/regenerate-picture/{os.environ['IDENTITY_ID']}"
response = requests.patch(
    url,
    headers={
        'Authorization': f"Bearer {os.environ['API_KEY']}",
        'Content-Type': 'application/json'
    },
    json={'age': 25, 'ethnicity': 'asian'}
)
print(response.json())
