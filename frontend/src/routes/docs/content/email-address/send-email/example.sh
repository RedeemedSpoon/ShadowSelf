curl -X POST "https://shadowself.io/api/email/send-email/$IDENTITY_ID" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $API_KEY" \
     -d '{
           "to": "recipient@example.com",
           "subject": "API Test Email",
           "body": "This is the body of the test email sent via API.",
           "inReplyTo": "<f0e9d8c7-b6a5-4321-fedc-ba0987654321@example.org>",
           "references": ["<f0e9d8c7-b6a5-4321-fedc-ba0987654321@example.org>"],
           "attachments": [
             {
               "filename": "document.pdf",
               "data": "JVBERi0xLjcK..."
             }
           ],
           "draft": 123
         }'
