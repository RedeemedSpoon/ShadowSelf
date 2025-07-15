package main

import ("bytes"; "fmt"; "io"; "net/http"; "os")

func main() {
	url := fmt.Sprintf("https://shadowself.io/api/email/save-draft/%s", os.Getenv("IDENTITY_ID"))
	payload := []byte(`{
		"to": "recipient@example.com",
		"subject": "Updated Draft Subject",
		"body": "Continuing to write this email...",
		"attachments": [{"filename": "idea.txt", "data": "VGhpcyBpcyBteSB..."}],
		"draft": 45
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
