package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
)

type AccountUpdate struct {
    ID       int    `json:"id"`
    Password string `json:"password"` // Newly re-encrypted data
    Totp     string `json:"totp,omitempty"` // Newly re-encrypted data
}

type UpdateEncryptionPayload struct {
    Accounts []AccountUpdate `json:"accounts"`
}

func main() {
    apiKey := os.Getenv("API_KEY")
    identityId := os.Getenv("IDENTITY_ID")
     if apiKey == "" || identityId == "" {
         fmt.Println("Error: API_KEY and IDENTITY_ID env vars must be set.")
         os.Exit(1)
    }

    apiURL := fmt.Sprintf("https://shadowself.io/api/account/update-encryption/%s", identityId)

    // IMPORTANT: Fetch, decrypt old, re-encrypt new client-side first
    reEncryptedPass1 := "U2FsdGVkX1+NewKeyEncPassDataOne=="
    reEncryptedTotp1 := "U2FsdGVkX1+NewKeyEncTotpDataOne=="
    reEncryptedPass2 := "U2FsdGVkX1+NewKeyEncPassDataTwo=="

    payloadData := UpdateEncryptionPayload{
        Accounts: []AccountUpdate{
            {ID: 101, Password: reEncryptedPass1, Totp: reEncryptedTotp1},
            {ID: 102, Password: reEncryptedPass2},
        },
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
