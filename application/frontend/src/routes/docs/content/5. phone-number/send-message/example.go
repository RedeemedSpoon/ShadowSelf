package main

import ("bytes"; "fmt"; "io"; "net/http"; "os")

func main() {
	url := fmt.Sprintf("https://shadowself.io/api/phone/send-message/%s", os.Getenv("IDENTITY_ID"))
	payload := []byte(`{"addressee": "+14155550000", "body": "Hello from the Go API script!"}`)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	req.Header.Add("Authorization", "Bearer "+os.Getenv("API_KEY"))
	req.Header.Add("Content-Type", "application/json")
	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}
