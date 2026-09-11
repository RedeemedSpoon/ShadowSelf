import json
import os
import urllib.request

payload = json.loads(r'''{
  "encryptionVersion": 1,
  "username": "example",
  "password": "v1.AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=",
  "website": "https://example.com",
  "totp": null,
  "algorithm": null
}''')
request = urllib.request.Request(
    'https://shadowself.io/api/account/add-account/' + os.environ['IDENTITY_ID'],
    data=json.dumps(payload).encode(),
    headers={'Authorization': 'Bearer ' + os.environ['API_KEY'], 'Content-Type': 'application/json'},
    method='POST',
)
with urllib.request.urlopen(request) as response:
    print(response.read().decode())
