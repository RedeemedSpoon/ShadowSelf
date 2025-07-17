package main

import ("bytes"; "fmt"; "io"; "net/http"; "os")

func main() {
	url := fmt.Sprintf("https://shadowself.io/api/account/add-account/%s", os.Getenv("IDENTITY_ID"))
	payload := []byte(`{
		"username": "forum_reader_12",
		"password": "U2FsdGVkX19abcDefGhiJKLmnoPqrStuVwxYz012345=",
		"website": "https://communityforum.org",
		"totp": "U2FsdGVkX1+zxcvBNMqwertyUIOPasdfghJKL098765=",
		"algorithm": "SHA256"
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
