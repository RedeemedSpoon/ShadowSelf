import os, requests, json

api_key = os.environ['API_KEY']
identity_id = os.environ['IDENTITY_ID']
api_url = f"https://shadowself.io/api/account/edit-account/{identity_id}"
account_entry_id = 101

headers = {
  'Authorization': f'Bearer {api_key}',
  'Content-Type': 'application/json'
}
new_encrypted_password = "U2FsdGVkX1+UpdatedPassDataLooksLikeThisMaybe=="
payload = {
  "id": account_entry_id,
  "username": "jd_service_user_revised",
  "password": new_encrypted_password,
  "website": "https://service-updated.example.com"
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
