import os
import requests

url = f"https://shadowself.io/api/account/add-account/{os.environ['IDENTITY_ID']}"
payload = {
    "username": "forum_reader_12",
    "password": "U2FsdGVkX19abcDefGhiJKLmnoPqrStuVwxYz012345=",
    "website": "https://communityforum.org",
    "totp": "U2FsdGVkX1+zxcvBNMqwertyUIOPasdfghJKL098765=",
    "algorithm": "SHA256"
}
response = requests.post(
    url,
    headers={'Authorization': f"Bearer {os.environ['API_KEY']}"},
    json=payload
)
print(response.json())
