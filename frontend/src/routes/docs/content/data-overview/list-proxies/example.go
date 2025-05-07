package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
)

func main() {
	apiKey := os.Getenv("API_KEY")
	if apiKey == "" {
		log.Fatal("API_KEY missing.")
	}

	apiURL := "https://shadowself.io/api/proxy"
	req, _ := http.NewRequest("GET", apiURL, nil)
	req.Header.Add("Authorization", "Bearer "+apiKey)
	req.Header.Add("Accept", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Fatalf("Req Error: %v", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}
