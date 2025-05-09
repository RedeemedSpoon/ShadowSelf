package main

import (
  "bytes"; "encoding/json"; "fmt"; "io"; "net/http"; "os"
)

type Attachment struct {
  Filename string `json:"filename"`
  Data     string `json:"data"`
}

type EmailPayload struct {
  To          string       `json:"to"`
  Subject     string       `json:"subject"`
  Body        string       `json:"body"`
  Attachments []Attachment `json:"attachments,omitempty"`
  Draft       *int         `json:"draft,omitempty"`
}

func main() {
  apiKey := os.Getenv("API_KEY")
  identityId := os.Getenv("IDENTITY_ID")
  apiURL := fmt.Sprintf(
    "https://shadowself.io/api/email/save-draft/%s",
    identityId,
  )

  draftUID := 45
  payloadData := EmailPayload{
    To:      "recipient@example.com",
    Subject: "Updated Draft Subject",
    Body:    "Continuing to write this email...",
    Attachments: []Attachment{
      {Filename: "idea.txt", Data: "VGhpcyBpcyBteSB..."},
    },
    Draft: &draftUID,
  }
  payloadBytes, err := json.Marshal(payloadData)
  if err != nil {
    fmt.Printf("JSON marshal error: %v\n", err)
    os.Exit(1)
  }

  req, err := http.NewRequest("PUT", apiURL, bytes.NewBuffer(payloadBytes))
  if err != nil {
    fmt.Printf("Request creation error: %v\n", err)
    os.Exit(1)
  }
  req.Header.Add("Authorization", "Bearer "+apiKey)
  req.Header.Add("Content-Type", "application/json")

  client := &http.Client{}
  resp, err := client.Do(req)
  if err != nil {
    fmt.Printf("Request execution error: %v\n", err)
    os.Exit(1)
  }
  defer resp.Body.Close()

  body, err := io.ReadAll(resp.Body)
  if err != nil {
    fmt.Printf("Response read error: %v\n", err)
    os.Exit(1)
  }

  if resp.StatusCode >= 400 {
    fmt.Printf("API error: %s\n%s\n", resp.Status, string(body))
    os.Exit(1)
  }
  fmt.Println(string(body))
}
