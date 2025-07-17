package main

import ("bytes"; "fmt"; "io"; "net/http"; "os")

func main() {
	url := fmt.Sprintf("https://shadowself.io/api/account/edit-account/%s", os.Getenv("IDENTITY_ID"))
	payload := []byte(`{
		"id": 101,
		"username": "jd_service_user_revised",
		"password": "U2FsdGVkX1+UpdatedPassDataLooksLikeThisMaybe==",
		"website": "https://service-updated.example.com"
	}`)
	req, _ := http.NewRequest("PUT", url, bytes.NewBuffer(payload))
	req.Header.Add("Authorization", "Bearer "+os.Getenv("API_KEY"))
	req.Header.Add("Content-Type", "application/json")
	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}
