import os, requests, json

api_key = os.environ['API_KEY']
identity_id = os.environ['IDENTITY_ID']
api_url = (
  f"https://shadowself.io/api/account/update-encryption/{identity_id}"
)
headers = {
  'Authorization': f'Bearer {api_key}',
  'Content-Type': 'application/json'
}

re_encrypted_pass_1 = "U2FsdGVkX1+NewKeyEncPassDataOne=="
re_encrypted_totp_1 = "U2FsdGVkX1+NewKeyEncTotpDataOne=="
re_encrypted_pass_2 = "U2FsdGVkX1+NewKeyEncPassDataTwo=="

payload = {
  "accounts": [
    {"id": 101, "password": re_encrypted_pass_1, "totp": re_encrypted_totp_1},
    {"id": 102, "password": re_encrypted_pass_2}
  ]
}

try:
  response = requests.put(api_url, headers=headers, json=payload)
  response.raise_for_status()
  print(json.dumps(response.json(), indent=2))
except requests.exceptions.HTTPError as e:
  error_body = e.response.text
  try:
    error_json = e.response.json()
    error_body = json.dumps(error_json, indent=2)
  except json.JSONDecodeError:
    pass
  print(f"API error: {e.response.status_code}\n{error_body}")
except requests.exceptions.RequestException as e:
  print(f"Request failed: {e}")
