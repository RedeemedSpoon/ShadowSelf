use std::{env, time::Duration};
use futures_util::{SinkExt, StreamExt};
use http::Request;
use serde_json::Value;
use tokio::time::{interval, sleep};
use tokio_tungstenite::{connect_async_tls_with_config, tungstenite::protocol::Message};
use url::Url;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let api_key = env::var("API_KEY").expect("API_KEY missing");
    let identity_id = env::var("IDENTITY_ID").expect("IDENTITY_ID missing");
    let ws_url = Url::parse(&format!("wss://shadowself.io/ws-api/{}", identity_id))?;
    let request = Request::builder().uri(ws_url.as_str()).header("Authorization", format!("Bearer {}", api_key)).header("Sec-WebSocket-Key",tungstenite::handshake::client::generate_key()).header("Sec-WebSocket-Version","13").header("Connection","Upgrade").header("Upgrade","websocket").header("Host", ws_url.host_str().unwrap_or("")).body(())?;

    match connect_async_tls_with_config(request, None, false).await {
        Ok((ws_stream, _)) => {
            println!("Connected to {}", identity_id);
            let (mut writer, mut reader) = ws_stream.split();

            // Simple Ping Task
            tokio::spawn(async move {
                let mut ticker = interval(Duration::from_secs(45));
                loop {
                    ticker.tick().await;
                    if writer.send(Message::Ping(vec![])).await.is_err() { break; }
                }
            });

            // Simple Read Loop
            while let Some(msg_result) = reader.next().await {
                match msg_result {
                    Ok(Message::Text(text)) => {
                        if let Ok(v) = serde_json::from_str::<Value>(&text) {
                            println!("Received event: {}", v.get("type").and_then(Value::as_str).unwrap_or("Unknown"));
                        } // Ignore non-JSON
                    },
                    Ok(Message::Pong(_)) => { /* Ignore pong */ }
                    Ok(Message::Close(_)) => { println!("Connection closed."); break; },
                    Err(e) => { eprintln!("Read error: {}", e); break; },
                    _ => {} // Ignore Ping, Binary
                }
            }
        },
        Err(e) => eprintln!("Connection failed: {}", e),
    }
    println!("Exiting."); Ok(())
}
