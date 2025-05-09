package main

import ("fmt"; "io"; "net/http"; "net/url"; "os")

func main() {
	proxyHost := os.Getenv("PROXY_HOST")
	proxyPort := os.Getenv("PROXY_PORT")
	proxyUser := os.Getenv("PROXY_USER")
	proxyPass := os.Getenv("PROXY_PASS")
	targetURL := "https://httpbin.org/ip"

	proxyStr := fmt.Sprintf("http://%s:%s@%s:%s",
		proxyUser, proxyPass, proxyHost, proxyPort)
	proxyURL, err := url.Parse(proxyStr)
	if err != nil {
		fmt.Printf("Error parsing proxy URL: %v\n", err)
		os.Exit(1)
	}

	transport := &http.Transport{Proxy: http.ProxyURL(proxyURL)}
	client := &http.Client{Transport: transport}

	resp, err := client.Get(targetURL)
	if err != nil {
		fmt.Printf("Error making request via proxy: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("Error reading response body: %v\n", err)
		os.Exit(1)
	}

	if resp.StatusCode >= 400 {
		fmt.Printf("Error response: %s\n%s\n", resp.Status, string(body))
		os.Exit(1)
	}
	fmt.Println(string(body))
}
