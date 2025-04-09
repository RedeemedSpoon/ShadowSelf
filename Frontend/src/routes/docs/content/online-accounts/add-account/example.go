package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
)

type AccountPayload struct {
    Username  string `json:"username"`
    Password  string `json:"password"` // Client-side encrypted data
    Website   string `json:"website,omitempty"`
    Totp      string `json:"totp,omitempty"` // Client-side encrypted data
    Algorithm string `json:"algorithm,omitempty"`
}

func main() {
    apiKey := os.Getenv("API_KEY")
    identityId := os.Getenv("IDENTITY_ID")
     if apiKey == "" || identityId == "" {
         fmt.Println("Error: API_KEY and IDENTITY_ID env vars must be set.")
         os.Exit(1)
    }

    apiURL := fmt.Sprintf("https://shadowself.io/api/account/add-account/%s", identityId)

    // IMPORTANT: Encrypt plain data before creating payload
    encryptedPassword := "U2FsdGVkX19abcDefGhiJKLmnoPqrStuVwxYz012345="
    encryptedTotp := "U2FsdGVkX1+zxcvBNMqwertyUIOPasdfghJKL098765="

    payloadData := AccountPayload{
        Username:  "forum_reader_12",
        Password:  encryptedPassword,
        Website:   "https://communityforum.org",
        Totp:      encryptedTotp,
        Algorithm: "SHA256",
    }
    payloadBytes, err := json.Marshal(payloadData)
    if err != nil { fmt.Printf("Error marshalling JSON: %v\n", err); os.Exit(1) }

    req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(payloadBytes))
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
