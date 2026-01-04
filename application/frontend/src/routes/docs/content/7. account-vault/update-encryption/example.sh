RE_ENCRYPTED_PASS_1="U2FsdGVkX1+NewKeyEncPassDataOne=="
RE_ENCRYPTED_TOTP_1="U2FsdGVkX1+NewKeyEncTotpDataOne=="
RE_ENCRYPTED_PASS_2="U2FsdGVkX1+NewKeyEncPassDataTwo=="

curl -X PUT "https://shadowself.io/api/account/update-encryption/$IDENTITY_ID" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $API_KEY" \
     -d '{
           "accounts": [
             {
               "id": 101,
               "password": "'"$RE_ENCRYPTED_PASS_1"'",
               "totp": "'"$RE_ENCRYPTED_TOTP_1"'"
             },
             {
               "id": 102,
               "password": "'"$RE_ENCRYPTED_PASS_2"'"
             }
           ]
         }'
