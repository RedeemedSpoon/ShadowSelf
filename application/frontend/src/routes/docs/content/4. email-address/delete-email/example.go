package main

import ("bytes"; "fmt"; "io"; "net/http"; "os")

func main() {
	url := fmt.Sprintf("https://shadowself.io/api/email/delete-email/%s", os.Getenv("IDENTITY_ID"))
	payload := []byte(`{"mailbox": "INBOX", "uid": 105}`)
	req, _ := http.NewRequest("DELETE", url, bytes.NewBuffer(payload))
	req.Header.Add("Authorization", "Bearer "+os.Getenv("API_KEY"))
	req.Header.Add("Content-Type", "application/json")
	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}
