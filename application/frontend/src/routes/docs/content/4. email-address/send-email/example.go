package main

import ("bytes"; "fmt"; "io"; "net/http"; "os")

func main() {
	url := fmt.Sprintf("https://shadowself.io/api/email/send-email/%s", os.Getenv("IDENTITY_ID"))
	payload := []byte(`{
		"to": "recipient@example.com",
		"subject": "API Test Email",
		"body": "This is the <b>HTML</b> body.",
		"inReplyTo": "<f0e9d8c7-b6a5-4321-fedc-ba0987654321@example.org>",
		"references": ["<f0e9d8c7-b6a5-4321-fedc-ba0987654321@example.org>"],
		"attachments": [{"filename": "document.pdf", "data": "JVBERi0xLjcK..."}],
		"draft": 123
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
