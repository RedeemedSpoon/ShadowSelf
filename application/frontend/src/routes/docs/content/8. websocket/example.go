package main

import (
	"encoding/json"; "fmt"; "net/http"; "os"; "time"
	"github.com/gorilla/websocket"
)

func main() {
	url := fmt.Sprintf("wss://shadowself.io/ws-api/%s", os.Getenv("IDENTITY_ID"))
	headers := http.Header{"Authorization": {"Bearer " + os.Getenv("API_KEY")}}
	conn, _, _ := websocket.DefaultDialer.Dial(url, headers)
	defer conn.Close()

	go func() {
		for range time.Tick(45 * time.Second) {
			conn.WriteMessage(websocket.PingMessage, nil)
		}
	}()

	for {
		_, msg, _ := conn.ReadMessage()
		var event map[string]interface{}
		json.Unmarshal(msg, &event)
		if event != nil && event["type"] != nil {
			fmt.Printf("Received event: %s\n", event["type"])
		}
	}
}
