package main

import ("fmt"; "io"; "net/http"; "net/url"; "os")

func main() {
	proxyStr := fmt.Sprintf("http://%s:%s@%s:%s", os.Getenv("PROXY_USER"), os.Getenv("PROXY_PASS"), os.Getenv("PROXY_HOST"), os.Getenv("PROXY_PORT"))
	proxyURL, _ := url.Parse(proxyStr)
	client := &http.Client{Transport: &http.Transport{Proxy: http.ProxyURL(proxyURL)}}
	resp, _ := client.Get("https://httpbin.org/ip")
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}
