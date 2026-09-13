package main

import (
 "fmt"
 "io"
 "net/http"
 "os"
 "strings"
)

func main() {
 payload := `{
  "vaultRevision": 1,
  "accounts": [
    {
      "id": 101,
      "password": "v1.AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=",
      "totp": null
    }
  ],
  "blob": "v1.AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=",
  "keys": {
    "address": "v1.AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=",
    "viewKey": "v1.AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=",
    "spendKey": "v1.AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE="
  }
}`
 request, err := http.NewRequest("PUT", "https://shadowself.io/api/account/update-encryption/"+os.Getenv("IDENTITY_ID"), strings.NewReader(payload))
 if err != nil { panic(err) }
 request.Header.Set("Authorization", "Bearer "+os.Getenv("API_KEY"))
 request.Header.Set("Content-Type", "application/json")
 response, err := http.DefaultClient.Do(request)
 if err != nil { panic(err) }
 defer response.Body.Close()
 body, err := io.ReadAll(response.Body)
 if err != nil { panic(err) }
 if response.StatusCode != 200 { panic(string(body)) }
 fmt.Println(string(body))
}
