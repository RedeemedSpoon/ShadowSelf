curl -X PUT "https://shadowself.io/api/email/save-draft/$IDENTITY_ID" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $API_KEY" \
     -d '{
           "to": "recipient@example.com",
           "subject": "Draft Subject",
           "body": "Starting to write this email...",
           "attachments": [ {"filename": "idea.txt", "data": "VGhpcyBpcyBteSB..."} ],
           "draft": 45
         }'
