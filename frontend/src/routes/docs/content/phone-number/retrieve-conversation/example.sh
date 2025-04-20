ADDRESSEE_PHONE="+14155550000"
ADDRESSEE_PHONE_ENCODED=$(echo "$ADDRESSEE_PHONE" | sed 's/+/%2B/')

curl -X GET "https://shadowself.io/api/phone/fetch-conversation/$IDENTITY_ID?addressee=$ADDRESSEE_PHONE_ENCODED" \
     -H "Accept: application/json" \
     -H "Authorization: Bearer $API_KEY"
