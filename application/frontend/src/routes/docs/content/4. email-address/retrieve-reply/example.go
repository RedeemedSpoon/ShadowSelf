package main

import ("fmt"; "io"; "net/http"; "net/url"; "os")

func main() {
  apiKey := os.Getenv("API_KEY")
  identityId := os.Getenv("IDENTITY_ID")
  emailUUID := "<a1b2c3d4-e5f6-7890-1234-567890abcdef@shadowself.io>"
  baseApiURL := fmt.Sprintf(
    "https://shadowself.io/api/email/fetch-reply/%s",
    identityId,
  )

  params := url.Values{}
  params.Add("uuid", emailUUID)
  apiURL := baseApiURL + "?" + params.Encode()

  req, err := http.NewRequest("GET", apiURL, nil)
  if err != nil {
    fmt.Printf("Error creating request: %v\n", err)
    os.Exit(1)
  }
  req.Header.Add("Authorization", "Bearer "+apiKey)
  req.Header.Add("Accept", "application/json")

  client := &http.Client{}
  resp, err := client.Do(req)
  if err != nil {
    fmt.Printf("Request error: %v\n", err)
    os.Exit(1)
  }
  defer resp.Body.Close()

  body, err := io.ReadAll(resp.Body)
  if err != nil {
    fmt.Printf("Error reading response body: %v\n", err)
    os.Exit(1)
  }

  if resp.StatusCode >= 400 {
    fmt.Printf("API error: %s\n%s\n", resp.Status, string(body))
    os.Exit(1)
  }
  fmt.Println(string(body))
}
