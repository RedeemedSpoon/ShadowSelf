use std::{env, error::Error};
use serde_json::json;
use reqwest::Client;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
  let api_key = env::var("API_KEY").unwrap();
  let identity_id = env::var("IDENTITY_ID").unwrap();

  let api_url = format!(
    "https://shadowself.io/api/account/delete-account/{}",
    identity_id
  );
  let account_entry_id = 103;
  let payload = json!({ "id": account_entry_id });

  let client = Client::new();
  let response = client
    .delete(&api_url)
    .bearer_auth(api_key)
    .json(&payload)
    .send()
    .await?
    .error_for_status()?;

  let status = response.status();
  let body_text = response.text().await?;

  if status == 204 || (status.is_success() && body_text.is_empty()) {
    println!("Delete successful (Status: {})", status);
  } else {
    println!("{}", body_text);
  }

  Ok(())
}
