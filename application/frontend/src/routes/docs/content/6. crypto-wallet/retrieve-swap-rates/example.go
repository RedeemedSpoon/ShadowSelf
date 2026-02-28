package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
)

func main() {
	url := fmt.Sprintf("https://shadowself.io/api/crypto/swap-rates/%s?coinFrom=btc&coinTo=xmr&amount=0.01", os.Getenv("IDENTITY_ID"))
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Add("Authorization", "Bearer "+os.Getenv("API_KEY"))
	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}
