use std::{env, error::Error};
use serde_json::json;
use reqwest::Client;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
  let api_key = env::var("API_KEY").unwrap();
  let identity_id = env::var("IDENTITY_ID").unwrap();

  let api_url = format!(
    "https://shadowself.io/api/account/update-encryption/{}",
    identity_id
  );

  let re_encrypted_pass_1 = "U2FsdGVkX1+NewKeyEncPassDataOne==";
  let re_encrypted_totp_1 = "U2FsdGVkX1+NewKeyEncTotpDataOne==";
  let re_encrypted_pass_2 = "U2FsdGVkX1+NewKeyEncPassDataTwo==";

  let payload = json!({
    "accounts": [
      { "id": 101, "password": re_encrypted_pass_1, "totp": re_encrypted_totp_1 },
      { "id": 102, "password": re_encrypted_pass_2 }
    ]
  });

  let client = Client::new();
  let response = client
    .put(&api_url)
    .bearer_auth(api_key)
    .json(&payload)
    .send().await?
    .error_for_status()?;

  println!("{}", response.text().await?);

  Ok(())
}
