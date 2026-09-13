curl --fail-with-body --request DELETE "https://shadowself.io/api/account/delete-account/${IDENTITY_ID}" \
  --header "Authorization: Bearer ${API_KEY}" \
  --header "Content-Type: application/json" \
  --data-binary '{
  "vaultRevision": 1,
  "id": 101
}'
