package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
	"github.com/gorilla/websocket"
)

type EventBase struct { Type string `json:"type"` }

func main() {
	apiKey:=os.Getenv("API_KEY"); identityId:=os.Getenv("IDENTITY_ID")
	if apiKey==""||identityId=="" { log.Fatal("Vars missing.") }

	wsURL:=fmt.Sprintf("wss://shadowself.io/ws-api/%s",identityId);
    headers:=http.Header{"Authorization":{"Bearer "+apiKey}}

	conn, _, err := websocket.DefaultDialer.Dial(wsURL, headers)
	if err != nil { log.Fatalf("Dial error: %v", err) }
	defer conn.Close()
	log.Printf("Connected to %s", identityId)

    // Simple Ping Goroutine
    go func() {
        ticker := time.NewTicker(45 * time.Second)
        defer ticker.Stop()
        for range ticker.C {
             if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
                  log.Println("Ping failed:", err); return
             }
        }
    }()

    // Simple Read Loop
	for {
		_, message, err := conn.ReadMessage()
		if err != nil { log.Println("Read error:", err); break }

        var baseEvent EventBase
        if json.Unmarshal(message, &baseEvent) == nil {
             fmt.Printf("Received event: %s\n", baseEvent.Type)
        } // Ignore non-JSON/pong
	}
    log.Println("Disconnected.")
}
