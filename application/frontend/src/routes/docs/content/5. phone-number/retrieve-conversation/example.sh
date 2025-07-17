ADDRESSEE_PHONE="%2B14155550000"

curl -X GET "https://shadowself.io/api/phone/fetch-conversation/$IDENTITY_ID?addressee=$ADDRESSEE_PHONE" \
     -H "Accept: application/json" \
     -H "Authorization: Bearer $API_KEY"
