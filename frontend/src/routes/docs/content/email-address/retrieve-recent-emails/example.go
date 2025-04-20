package main

import (
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
         fmt.Println("Error: API_KEY and IDENTITY_ID env vars must be set.")
         os.Exit(1)
    }

    apiURL := fmt.Sprintf("https://shadowself.io/api/email/%s", identityId)

    req, err := http.NewRequest("GET", apiURL, nil)
    if err != nil {
        fmt.Printf("Error creating request: %v\n", err); os.Exit(1)
    }

    req.Header.Add("Authorization", "Bearer "+apiKey)
    req.Header.Add("Accept", "application/json")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        fmt.Printf("Request Error: %v\n", err); os.Exit(1)
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        fmt.Printf("Error reading response: %v\n", err); os.Exit(1)
    }

    fmt.Println(string(body))
}
