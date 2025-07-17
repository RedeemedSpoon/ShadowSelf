package main

import ("fmt"; "io"; "net/http"; "net/url"; "os")

func main() {
	addressee := url.QueryEscape("+14155550000")
	apiURL := fmt.Sprintf(
		"https://shadowself.io/api/phone/fetch-conversation/%s?addressee=%s",
		os.Getenv("IDENTITY_ID"),
		addressee,
	)
	req, _ := http.NewRequest("GET", apiURL, nil)
	req.Header.Add("Authorization", "Bearer "+os.Getenv("API_KEY"))
	req.Header.Add("Accept", "application/json")
	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}
