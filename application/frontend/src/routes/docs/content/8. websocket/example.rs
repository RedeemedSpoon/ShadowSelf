use std::{env, time::Duration};
use futures_util::{SinkExt, StreamExt};
use http::Request;
use serde_json::Value;
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};

#[tokio::main]
async fn main() {
    let url = format!("wss://shadowself.io/ws-api/{}", env::var("IDENTITY_ID").unwrap());
    let req = Request::builder()
        .uri(&url)
        .header("Authorization", format!("Bearer {}", env::var("API_KEY").unwrap()))
        .body(())
        .unwrap();

    let (ws_stream, _) = connect_async(req).await.unwrap();
    let (mut writer, mut reader) = ws_stream.split();

    tokio::spawn(async move {
        loop {
            tokio::time::sleep(Duration::from_secs(45)).await;
            writer.send(Message::Ping(vec![])).await.unwrap();
        }
    });

    while let Some(Ok(Message::Text(text))) = reader.next().await {
        let v: Value = serde_json::from_str(&text).unwrap();
        if let Some(t) = v.get("type").and_then(|v| v.as_str()) {
            println!("Received event: {}", t);
        }
    }
}
