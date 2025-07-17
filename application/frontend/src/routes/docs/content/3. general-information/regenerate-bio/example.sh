curl -X PATCH "https://shadowself.io/api/identity/regenerate-bio/$IDENTITY_ID" \
     -H "Authorization: Bearer $API_KEY" \
     -H "Content-Type: application/json" \
     -d '{}' # PATCH requires a body, even if empty
