use std::{env, time::Duration};
use futures_util::{SinkExt, StreamExt};
use http::Request;
use serde_json::Value;
use tokio::time::interval;
use tokio_tungstenite::{
  connect_async_tls_with_config,
  tungstenite::protocol::Message,
  tungstenite::handshake::client::generate_key
};
use url::Url;

async fn run_client_session(
  ws_url: Url,
  api_key: String
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
  let request = Request::builder()
    .uri(ws_url.as_str())
    .header("Authorization", format!("Bearer {}", api_key))
    .header("Sec-WebSocket-Key", generate_key())
    .header("Sec-WebSocket-Version", "13")
    .header("Connection", "Upgrade")
    .header("Upgrade", "websocket")
    .header("Host", ws_url.host_str().unwrap_or_default())
    .body(())?;

  let (ws_stream, _) = connect_async_tls_with_config(request, None, false)
    .await
    .map_err(|e| format!("Connection failed: {}", e))?;

  let (mut writer, mut reader) = ws_stream.split();

  tokio::spawn(async move {
    let mut ticker = interval(Duration::from_secs(45));
    loop {
      ticker.tick().await;
      if writer.send(Message::Ping(Vec::new())).await.is_err() {
        break;
      }
    }
  });

  while let Some(msg_result) = reader.next().await {
    match msg_result {
      Ok(Message::Text(text)) => {
        if let Ok(v) = serde_json::from_str::<Value>(&text) {
          if let Some(e_type) = v.get("type").and_then(Value::as_str) {
            println!("Received event: {}", e_type);
          }
        }
      }
      Ok(Message::Close(frame)) => {
        if let Some(cf) = frame {
          eprintln!("Connection closed: {} {}", cf.code, cf.reason);
        } else { eprintln!("Connection closed without frame."); }
        break;
      }
      Err(e) => { eprintln!("Read error: {}", e); break; }
      _ => {}
    }
  }
  Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
  let api_key = env::var("API_KEY").unwrap();
  let identity_id = env::var("IDENTITY_ID").unwrap();
  let ws_url_str = format!("wss://shadowself.io/ws-api/{}", identity_id);
  let ws_url = Url::parse(&ws_url_str)?;

  if let Err(e) = run_client_session(ws_url, api_key).await {
    eprintln!("Client session error: {}", e);
  }
  Ok(())
}
