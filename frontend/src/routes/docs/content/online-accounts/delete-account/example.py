import os, requests, json

api_key = os.environ['API_KEY']
identity_id = os.environ['IDENTITY_ID']
api_url = f"https://shadowself.io/api/account/delete-account/{identity_id}"
account_entry_id = 103

headers = {
  'Authorization': f'Bearer {api_key}',
  'Content-Type': 'application/json'
}
payload = {"id": account_entry_id}

try:
  response = requests.delete(api_url, headers=headers, json=payload)
  response.raise_for_status()

  if response.status_code == 204 or not response.content:
    print(f"Delete successful (Status: {response.status_code})")
  elif response.headers.get('content-type') == 'application/json':
    print(json.dumps(response.json(), indent=2))
  else:
    print(response.text)
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
