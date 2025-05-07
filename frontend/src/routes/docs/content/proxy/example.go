package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
)

func main() {
	proxyHost := os.Getenv("PROXY_HOST")
	proxyPort := os.Getenv("PROXY_PORT")
	proxyUser := os.Getenv("PROXY_USER")
	proxyPass := os.Getenv("PROXY_PASS")

	if proxyHost == "" || proxyPort == "" || proxyUser == "" || proxyPass == "" {
		log.Fatal("PROXY_HOST, PROXY_PORT, PROXY_USER, PROXY_PASS env vars must be set.")
	}

	targetURL := "https://httpbin.org/ip"
	proxyStr := fmt.Sprintf("https://%s:%s@%s:%s", proxyUser, proxyPass, proxyHost, proxyPort)
	proxyURL, err := url.Parse(proxyStr)
	if err != nil {
		log.Fatalf("Failed to parse proxy URL: %v", err)
	}

	proxyTransport := &http.Transport{
		Proxy: http.ProxyURL(proxyURL),
	}

	client := &http.Client{Transport: proxyTransport}

	log.Printf("Making request to %s via proxy %s...", targetURL, proxyHost)

	resp, err := client.Get(targetURL)
	if err != nil {
		log.Fatalf("Failed to make request via proxy: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Fatalf("Failed to read response body: %v", err)
	}

	log.Printf("Status Code: %d", resp.StatusCode)
	log.Println("Response Body:")
	fmt.Println(string(body))
}
