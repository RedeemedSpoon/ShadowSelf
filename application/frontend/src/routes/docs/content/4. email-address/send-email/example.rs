use std::{env, error::Error};
use serde_json::json;
use reqwest::Client;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
  let api_key = env::var("API_KEY").unwrap();
  let identity_id = env::var("IDENTITY_ID").unwrap();

  let api_url = format!(
    "https://shadowself.io/api/email/send-email/{}",
    identity_id
  );
  let pdf_data = "JVBERi0xLjcK...";
  let payload = json!({
    "to": "recipient@example.com",
    "subject": "API Test Email",
    "body": "This is the <b>HTML</b> body.",
    "inReplyTo": "<f0e9d8c7-b6a5-4321-fedc-ba0987654321@example.org>",
    "references": ["<f0e9d8c7-b6a5-4321-fedc-ba0987654321@example.org>"],
    "attachments": [ {"filename": "document.pdf", "data": pdf_data} ],
    "draft": 123
  });

  let client = Client::new();
  let response = client
    .post(&api_url)
    .bearer_auth(api_key)
    .json(&payload)
    .send()
    .await?
    .error_for_status()?;

  let status = response.status();
  let body_text = response.text().await?;

  if status.as_u16() == 204 || (status.is_success() && body_text.is_empty()) {
    println!("Request successful (Status: {})", status);
  } else {
    println!("{}", body_text);
  }

  Ok(())
}
