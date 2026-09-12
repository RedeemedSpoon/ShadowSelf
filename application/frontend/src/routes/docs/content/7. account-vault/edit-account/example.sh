curl --fail-with-body --request PUT "https://shadowself.io/api/account/edit-account/${IDENTITY_ID}" \
  --header "Authorization: Bearer ${API_KEY}" \
  --header "Content-Type: application/json" \
  --data-binary '{
  "encryptionVersion": 1,
  "id": 101,
  "username": "example",
  "password": "v1.AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=",
  "website": "https://example.com",
  "totp": null,
  "algorithm": null
}'
