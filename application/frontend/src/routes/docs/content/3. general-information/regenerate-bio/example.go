package main

import ("bytes"; "fmt"; "io"; "net/http"; "os")

func main() {
	url := fmt.Sprintf("https://shadowself.io/api/identity/regenerate-bio/%s", os.Getenv("IDENTITY_ID"))
	req, _ := http.NewRequest("PATCH", url, bytes.NewBuffer([]byte(`{}`)))
	req.Header.Add("Authorization", "Bearer "+os.Getenv("API_KEY"))
	req.Header.Add("Content-Type", "application/json")
	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}
