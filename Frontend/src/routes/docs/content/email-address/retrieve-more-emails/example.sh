MAILBOX="INBOX"
SINCE_UID=104

curl -X GET "https://shadowself.io/api/email/load-more/$IDENTITY_ID?mailbox=$MAILBOX&since=$SINCE_UID" \
     -H "Accept: application/json" \
     -H "Authorization: Bearer $API_KEY"
