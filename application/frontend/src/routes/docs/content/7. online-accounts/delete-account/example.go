package main

import ("bytes"; "fmt"; "io"; "net/http"; "os")

func main() {
	url := fmt.Sprintf("https://shadowself.io/api/account/delete-account/%s", os.Getenv("IDENTITY_ID"))
	payload := []byte(`{"id": 103}`)
	req, _ := http.NewRequest("DELETE", url, bytes.NewBuffer(payload))
	req.Header.Add("Authorization", "Bearer "+os.Getenv("API_KEY"))
	req.Header.Add("Content-Type", "application/json")
	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}
