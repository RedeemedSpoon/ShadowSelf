import json
import os
import urllib.request

payload = json.loads(r'''{
  "encryptionVersion": 1,
  "accounts": [
    {
      "id": 101,
      "password": "v1.AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=",
      "totp": null
    }
  ],
  "blob": "v1.AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=",
  "keys": {
    "address": "v1.AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=",
    "viewKey": "v1.AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=",
    "spendKey": "v1.AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE="
  }
}''')
request = urllib.request.Request(
    'https://shadowself.io/api/account/update-encryption/' + os.environ['IDENTITY_ID'],
    data=json.dumps(payload).encode(),
    headers={'Authorization': 'Bearer ' + os.environ['API_KEY'], 'Content-Type': 'application/json'},
    method='PUT',
)
with urllib.request.urlopen(request) as response:
    print(response.read().decode())
