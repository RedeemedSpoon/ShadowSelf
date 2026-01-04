import os
import requests

url = f"https://shadowself.io/api/account/edit-account/{os.environ['IDENTITY_ID']}"
payload = {
    "id": 101,
    "username": "jd_service_user_revised",
    "password": "U2FsdGVkX1+UpdatedPassDataLooksLikeThisMaybe==",
    "website": "https://service-updated.example.com"
}
response = requests.put(
    url,
    headers={'Authorization': f"Bearer {os.environ['API_KEY']}"},
    json=payload
)
print(response.json())
