import os, requests, json

api_key = os.environ['API_KEY']
identity_id = os.environ['IDENTITY_ID']
api_url = f"https://shadowself.io/api/email/forward-email/{identity_id}"

headers = {
  'Authorization': f'Bearer {api_key}',
  'Content-Type': 'application/json'
}
payload = {"uid": 105, "forward": "forward.recipient@another.com"}

try:
  response = requests.post(api_url, headers=headers, json=payload)
  response.raise_for_status()
  if response.status_code == 204 or not response.content:
    print(f"Request successful (Status: {response.status_code})")
  else:
    try:
      print(json.dumps(response.json(), indent=2))
    except json.JSONDecodeError:
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
