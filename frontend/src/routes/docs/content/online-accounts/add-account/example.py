import os
import requests
import json

# Requires API_KEY and IDENTITY_ID environment variables
api_key = os.environ.get('API_KEY')
identity_id = os.environ.get('IDENTITY_ID')

if not api_key or not identity_id:
    print("Error: API_KEY and IDENTITY_ID env vars must be set.")
    exit(1)

api_url = f"https://shadowself.io/api/account/add-account/{identity_id}"

headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

# IMPORTANT: Encrypt password_plain and totp_secret_plain using your client-side method first!
encrypted_password = "U2FsdGVkX19abcDefGhiJKLmnoPqrStuVwxYz012345="
encrypted_totp = "U2FsdGVkX1+zxcvBNMqwertyUIOPasdfghJKL098765="

payload = {
    "username": "forum_reader_12",
    "password": encrypted_password,
    "website": "https://communityforum.org",
    "totp": encrypted_totp,
    "algorithm": "SHA256"
}

try:
    response = requests.post(api_url, headers=headers, json=payload)
    response.raise_for_status()
    print(json.dumps(response.json(), indent=2))
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
except Exception as e:
    print(f"An error occurred: {e}")
