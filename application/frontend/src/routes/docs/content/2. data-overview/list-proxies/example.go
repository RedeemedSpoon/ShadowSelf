package main

import ("fmt"; "io"; "net/http"; "os")

func main() {
	req, _ := http.NewRequest("GET", "https://shadowself.io/api/proxy", nil)
	req.Header.Add("Authorization", "Bearer "+os.Getenv("API_KEY"))
	req.Header.Add("Accept", "application/json")
	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}
