use std::{env, error::Error};
use serde_json::json;
use reqwest::Client;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
  let api_key = env::var("API_KEY").unwrap();
  let identity_id = env::var("IDENTITY_ID").unwrap();

  let api_url = format!(
    "https://shadowself.io/api/email/save-draft/{}",
    identity_id
  );
  let payload = json!({
    "to": "recipient@example.com",
    "subject": "Updated Draft Subject",
    "body": "Continuing to write this email...",
    "attachments": [ {"filename": "idea.txt", "data": "VGhpcyBpcyBteSB..."} ],
    "draft": 45
  });

  let client = Client::new();
  let response = client
    .put(&api_url)
    .bearer_auth(api_key)
    .json(&payload)
    .send()
    .await?
    .error_for_status()?;

  println!("{}", response.text().await?);

  Ok(())
}
