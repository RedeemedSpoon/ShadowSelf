package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
)

type Attachment struct {
    Filename    string `json:"filename"`
    Data        string `json:"data"`
}
type EmailPayload struct {
    To          string       `json:"to"`
    Subject     string       `json:"subject"`
    Body        string       `json:"body"`
    InReplyTo   string       `json:"inReplyTo,omitempty"`
    References  []string     `json:"references,omitempty"`
    Attachments []Attachment `json:"attachments,omitempty"`
    Draft       *int         `json:"draft,omitempty"`
}

func main() {
    apiKey := os.Getenv("API_KEY")
    identityId := os.Getenv("IDENTITY_ID")
     if apiKey == "" || identityId == "" {
         fmt.Println("Error: API_KEY and IDENTITY_ID env vars must be set.")
         os.Exit(1)
    }

    apiURL := fmt.Sprintf("https://shadowself.io/api/email/send-email/%s", identityId)

    pdfData := "JVBERi0xLjcK..."
    draftUID := 123

    payloadData := EmailPayload{
        To:         "recipient@example.com",
        Subject:    "API Test Email",
        Body:       "This is the <b>HTML</b> body.",
        InReplyTo:  "<f0e9d8c7-b6a5-4321-fedc-ba0987654321@example.org>",
        References: []string{"<f0e9d8c7-b6a5-4321-fedc-ba0987654321@example.org>"},
        Attachments: []Attachment{ {Filename: "document.pdf", Data: pdfData} },
        Draft:      &draftUID,
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
