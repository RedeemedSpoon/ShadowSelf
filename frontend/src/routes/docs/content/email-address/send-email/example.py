import os, requests, json

api_key = os.environ['API_KEY']
identity_id = os.environ['IDENTITY_ID']
api_url = f"https://shadowself.io/api/email/send-email/{identity_id}"

headers = {
  'Authorization': f'Bearer {api_key}',
  'Content-Type': 'application/json'
}
pdf_data = "JVBERi0xLjcK..."
payload = {
  "to": "recipient@example.com",
  "subject": "API Test Email",
  "body": "This is the <b>HTML</b> body of the test email.",
  "inReplyTo": "<f0e9d8c7-b6a5-4321-fedc-ba0987654321@example.org>",
  "references": ["<f0e9d8c7-b6a5-4321-fedc-ba0987654321@example.org>"],
  "attachments": [{"filename": "document.pdf", "data": pdf_data}],
  "draft": 123
}

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
