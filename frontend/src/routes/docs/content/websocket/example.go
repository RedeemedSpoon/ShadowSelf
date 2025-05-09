package main

import (
	"encoding/json"; "fmt"; "net/http"; "os"; "time"
	"github.com/gorilla/websocket"
)

type EventBase struct{ Type string `json:"type"` }

func main() {
	apiKey := os.Getenv("API_KEY")
	identityId := os.Getenv("IDENTITY_ID")
	wsURL := fmt.Sprintf("wss://shadowself.io/ws-api/%s", identityId)
	headers := http.Header{"Authorization": {"Bearer " + apiKey}}

	conn, _, err := websocket.DefaultDialer.Dial(wsURL, headers)
	if err != nil {
		fmt.Printf("Dial error: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close()

	go func() {
		ticker := time.NewTicker(45 * time.Second)
		defer ticker.Stop()
		for range ticker.C {
			if wErr := conn.WriteMessage(websocket.PingMessage, nil); wErr != nil {
				fmt.Printf("Ping failed: %v\n", wErr)
				return
			}
		}
	}()

	for {
		_, message, rErr := conn.ReadMessage()
		if rErr != nil {
			fmt.Printf("Read error: %v\n", rErr)
			break
		}
		var baseEvent EventBase
		if json.Unmarshal(message, &baseEvent) == nil && baseEvent.Type != "" {
			fmt.Printf("Received event: %s\n", baseEvent.Type)
		}
	}
}
