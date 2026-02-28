package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"os"
)

func main() {
	url := fmt.Sprintf("https://shadowself.io/api/crypto/swap-trades/%s", os.Getenv("IDENTITY_ID"))
	payload := []byte(`{
		"tradeID": "trade_12345",
		"coinTo": "xmr",
		"coinFrom": "btc",
		"amount": 0.01,
		"destinationAddress": "44AFFq...",
		"refundAddress": "bc1q...",
		"provider": "ProviderA",
		"isFixed": false
	}`)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	req.Header.Add("Authorization", "Bearer "+os.Getenv("API_KEY"))
	req.Header.Add("Content-Type", "application/json")
	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}
