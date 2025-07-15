use std::{env, error::Error};
use serde_json::json;
use reqwest::Client;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
  let api_key = env::var("API_KEY").unwrap();
  let identity_id = env::var("IDENTITY_ID").unwrap();

  let api_url = format!(
    "https://shadowself.io/api/phone/send-message/{}",
    identity_id
  );
  let payload = json!({
    "addressee": "+14155550000",
    "body": "Hello from the Rust API script!"
  });

  let client = Client::new();
  let response = client
    .post(&api_url)
    .bearer_auth(api_key)
    .json(&payload)
    .send()
    .await?
    .error_for_status()?;

  println!("{}", response.text().await?);

  Ok(())
}
