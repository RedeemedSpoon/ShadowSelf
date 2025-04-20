package main

import (
    "bytes"
    "fmt"
    "io"
    "net/http"
    "os"
)

func main() {
    // Requires API_KEY and IDENTITY_ID environment variables
    apiKey := os.Getenv("API_KEY")
    identityId := os.Getenv("IDENTITY_ID")
     if apiKey == "" || identityId == "" {
         fmt.Println("Error: API_KEY and IDENTITY_ID environment variables must be set.")
         os.Exit(1)
    }

    apiURL := fmt.Sprintf("https://shadowself.io/api/identity/regenerate-bio/%s", identityId)

    // Send empty JSON object as payload for PATCH
    payload := []byte(`{}`)

    req, _ := http.NewRequest("PATCH", apiURL, bytes.NewBuffer(payload))
    req.Header.Add("Authorization", "Bearer "+apiKey)
    req.Header.Add("Content-Type", "application/json")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        fmt.Printf("Request Error: %v\n", err)
        os.Exit(1)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}
