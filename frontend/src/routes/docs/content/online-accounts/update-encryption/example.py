import os
import requests
import json

# Requires API_KEY and IDENTITY_ID environment variables
api_key = os.environ.get('API_KEY')
identity_id = os.environ.get('IDENTITY_ID')

if not api_key or not identity_id:
    print("Error: API_KEY and IDENTITY_ID env vars must be set.")
    exit(1)

api_url = f"https://shadowself.io/api/account/update-encryption/{identity_id}"

headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

# IMPORTANT: Fetch accounts, decrypt old, re-encrypt new client-side first
re_encrypted_pass_1 = "U2FsdGVkX1+NewKeyEncPassDataOne=="
re_encrypted_totp_1 = "U2FsdGVkX1+NewKeyEncTotpDataOne=="
re_encrypted_pass_2 = "U2FsdGVkX1+NewKeyEncPassDataTwo=="

payload = {
    "accounts": [
        {
            "id": 101,
            "password": re_encrypted_pass_1,
            "totp": re_encrypted_totp_1
        },
        {
            "id": 102,
            "password": re_encrypted_pass_2
        }
    ]
}

try:
    response = requests.put(api_url, headers=headers, json=payload)
    response.raise_for_status()
    print(json.dumps(response.json(), indent=2))
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
except Exception as e:
    print(f"An error occurred: {e}")
