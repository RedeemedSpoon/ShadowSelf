use std::{env, error::Error};
use serde_json::json;
use reqwest::Client;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
  let api_key = env::var("API_KEY").unwrap();
  let identity_id = env::var("IDENTITY_ID").unwrap();

  let api_url = format!(
    "https://shadowself.io/api/account/edit-account/{}",
    identity_id
  );
  let account_entry_id = 101;
  let new_encrypted_password = "U2FsdGVkX1+UpdatedPassDataLooksLikeThisMaybe==";

  let payload = json!({
    "id": account_entry_id,
    "username": "jd_service_user_revised",
    "password": new_encrypted_password,
    "website": "https://service-updated.example.com"
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
