import os, requests, json

api_key = os.environ['API_KEY']
identity_id = os.environ['IDENTITY_ID']
api_url = f"https://shadowself.io/api/email/save-draft/{identity_id}"

headers = {
  'Authorization': f'Bearer {api_key}',
  'Content-Type': 'application/json'
}
payload = {
  "to": "recipient@example.com",
  "subject": "Updated Draft Subject",
  "body": "Continuing to write this email...",
  "attachments": [{"filename": "idea.txt", "data": "VGhpcyBpcyBteSB..."}],
  "draft": 45
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
