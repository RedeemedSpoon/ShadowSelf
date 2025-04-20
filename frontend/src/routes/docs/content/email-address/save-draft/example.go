package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
    // Use Attachment and EmailPayload structs defined earlier
)
// Assume Attachment and EmailPayload structs exist here

func main() {
    apiKey := os.Getenv("API_KEY")
    identityId := os.Getenv("IDENTITY_ID")
     if apiKey == "" || identityId == "" {
         fmt.Println("Error: API_KEY and IDENTITY_ID env vars must be set.")
         os.Exit(1)
    }

    apiURL := fmt.Sprintf("https://shadowself.io/api/email/save-draft/%s", identityId)

    draftUID := 45
    payloadData := EmailPayload{
        To:         "recipient@example.com",
        Subject:    "Updated Draft Subject",
        Body:       "Continuing to write this email...",
        Attachments: []Attachment{ {Filename: "idea.txt", Data: "VGhpcyBpcyBteSB..."} },
        Draft:      &draftUID,
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
