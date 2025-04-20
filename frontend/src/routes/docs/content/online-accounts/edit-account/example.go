package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
)

type AccountEditPayload struct {
    ID        int    `json:"id"`
    Username  string `json:"username"`
    Password  string `json:"password"`
    Website   string `json:"website,omitempty"`
    Totp      string `json:"totp,omitempty"`
    Algorithm string `json:"algorithm,omitempty"`
}

func main() {
    apiKey := os.Getenv("API_KEY")
    identityId := os.Getenv("IDENTITY_ID")
     if apiKey == "" || identityId == "" {
         fmt.Println("Error: API_KEY and IDENTITY_ID env vars must be set.")
         os.Exit(1)
    }

    apiURL := fmt.Sprintf("https://shadowself.io/api/account/edit-account/%s", identityId)
    accountEntryId := 101

    // IMPORTANT: Encrypt new password client-side first
    newEncryptedPassword := "U2FsdGVkX1+UpdatedPassDataLooksLikeThisMaybe=="

    payloadData := AccountEditPayload{
        ID:        accountEntryId,
        Username:  "jd_service_user_revised",
        Password:  newEncryptedPassword,
        Website:   "https://service-updated.example.com",
    }
    payloadBytes, err := json.Marshal(payloadData)
    if err != nil { fmt.Printf("Error marshalling JSON: %v\n", err); os.Exit(1) }

    req, err := http.NewRequest("PUT", apiURL, bytes.NewBuffer(payloadBytes))
    if err != nil { fmt.Printf("Error creating req: %v\n", err); os.Exit(1)}

    req.Header.Add("Authorization", "Bearer "+apiKey)
    req.Header.Add("Content-Type", "application/json")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil { fmt.Printf("Req Error: %v\n", err); os.Exit(1) }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
     if err != nil {fmt.Printf("Read Error: %v\n", err); os.Exit(1)}

    fmt.Println(string(body))
}
