package main

import (
  "bytes"; "encoding/json"; "fmt"; "io"; "net/http"; "os"
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
  apiURL := fmt.Sprintf(
    "https://shadowself.io/api/account/edit-account/%s",
    identityId,
  )
  accountEntryId := 101
  newEncryptedPassword := "U2FsdGVkX1+UpdatedPassDataLooksLikeThisMaybe=="

  payloadData := AccountEditPayload{
    ID:        accountEntryId,
    Username:  "jd_service_user_revised",
    Password:  newEncryptedPassword,
    Website:   "https://service-updated.example.com",
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
