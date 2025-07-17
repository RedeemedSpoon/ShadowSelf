EMAIL_UUID_ENCODED="%3Ca1b2c3d4-e5f6-7890-1234-567890abcdef%40shadowself.io%3E"

curl -X GET "https://shadowself.io/api/email/fetch-reply/$IDENTITY_ID?uuid=$EMAIL_UUID_ENCODED" \
     -H "Accept: application/json" \
     -H "Authorization: Bearer $API_KEY"
