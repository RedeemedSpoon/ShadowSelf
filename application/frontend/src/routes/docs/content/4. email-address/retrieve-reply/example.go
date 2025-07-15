package main

import ("fmt"; "io"; "net/http"; "net/url"; "os")

func main() {
	emailUUID := "<a1b2c3d4-e5f6-7890-1234-567890abcdef@shadowself.io>"
	apiURL := fmt.Sprintf(
		"https://shadowself.io/api/email/fetch-reply/%s?uuid=%s",
		os.Getenv("IDENTITY_ID"),
		url.QueryEscape(emailUUID),
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
