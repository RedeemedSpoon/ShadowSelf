import json
import os
import urllib.request

payload = json.loads(r'''{
  "vaultRevision": 1,
  "id": 101
}''')
request = urllib.request.Request(
    'https://shadowself.io/api/account/delete-account/' + os.environ['IDENTITY_ID'],
    data=json.dumps(payload).encode(),
    headers={'Authorization': 'Bearer ' + os.environ['API_KEY'], 'Content-Type': 'application/json'},
    method='DELETE',
)
with urllib.request.urlopen(request) as response:
    print(response.read().decode())
