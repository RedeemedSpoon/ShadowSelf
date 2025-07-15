package main

import ("fmt"; "io"; "net/http"; "net/url"; "os")

func main() {
  apiKey := os.Getenv("API_KEY")
  identityId := os.Getenv("IDENTITY_ID")
  addresseePhone := "+14155550000"
  baseApiURL := fmt.Sprintf(
    "https://shadowself.io/api/phone/fetch-conversation/%s",
    identityId,
  )

  params := url.Values{}
  params.Add("addressee", addresseePhone)
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
