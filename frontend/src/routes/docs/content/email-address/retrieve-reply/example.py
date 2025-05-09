import os
import requests
import json

api_key = os.environ['API_KEY']
identity_id = os.environ['IDENTITY_ID']
email_uuid = "<a1b2c3d4-e5f6-7890-1234-567890abcdef@shadowself.io>"
api_url = f"https://shadowself.io/api/email/fetch-reply/{identity_id}"

headers = {
  'Authorization': f'Bearer {api_key}',
  'Accept': 'application/json'
}
params = {'uuid': email_uuid}

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
