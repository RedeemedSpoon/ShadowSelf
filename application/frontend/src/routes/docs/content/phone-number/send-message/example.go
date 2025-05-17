package main

import (
  "bytes"; "encoding/json"; "fmt"; "io"; "net/http"; "os"
)

type MessagePayload struct {
  Addressee string `json:"addressee"`
  Body      string `json:"body"`
}

func main() {
  apiKey := os.Getenv("API_KEY")
  identityId := os.Getenv("IDENTITY_ID")
  apiURL := fmt.Sprintf(
    "https://shadowself.io/api/phone/send-message/%s",
    identityId,
  )

  payloadData := MessagePayload{
    Addressee: "+14155550000",
    Body:      "Hello from the Go API script!",
  }
  payloadBytes, err := json.Marshal(payloadData)
  if err != nil {
    fmt.Printf("JSON marshal error: %v\n", err)
    os.Exit(1)
  }

  req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(payloadBytes))
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
