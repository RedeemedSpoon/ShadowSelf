ENCRYPTED_PASS="U2FsdGVkX19abcDefGhiJKLmnoPqrStuVwxYz012345="
ENCRYPTED_TOTP="U2FsdGVkX1+zxcvBNMqwertyUIOPasdfghJKL098765="

curl -X POST "https://shadowself.io/api/account/add-account/$IDENTITY_ID" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $API_KEY" \
     -d '{
           "username": "forum_reader_12",
           "password": "'"$ENCRYPTED_PASS"'",
           "website": "https://communityforum.org",
           "totp": "'"$ENCRYPTED_TOTP"'",
           "algorithm": "SHA256"
         }'
