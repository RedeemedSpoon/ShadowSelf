import os
import requests
import json

api_key = os.environ['API_KEY']
identity_id = os.environ['IDENTITY_ID']
mailbox = "INBOX"
since_uid = 104
api_url = f"https://shadowself.io/api/email/load-more/{identity_id}"

headers = {
  'Authorization': f'Bearer {api_key}',
  'Accept': 'application/json'
}
params = {'mailbox': mailbox, 'since': since_uid}

try:
  response = requests.get(api_url, headers=headers, params=params)
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
