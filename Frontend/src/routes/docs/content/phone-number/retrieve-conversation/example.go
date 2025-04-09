package main

import (
    "fmt"
    "io"
    "net/http"
    "net/url"
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

    addresseePhone := "+14155550000"
    baseApiURL := fmt.Sprintf("https://shadowself.io/api/phone/fetch-conversation/%s", identityId)

    params := url.Values{}
    params.Add("addressee", addresseePhone)
    apiURL := baseApiURL + "?" + params.Encode()

    req, err := http.NewRequest("GET", apiURL, nil)
    if err != nil { fmt.Printf("Error creating req: %v\n", err); os.Exit(1)}

    req.Header.Add("Authorization", "Bearer "+apiKey)
    req.Header.Add("Accept", "application/json")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil { fmt.Printf("Req Error: %v\n", err); os.Exit(1) }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {fmt.Printf("Read Error: %v\n", err); os.Exit(1)}

    fmt.Println(string(body))
}
