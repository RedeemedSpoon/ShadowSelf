use std::{env, error::Error};
use serde_json::json;
use reqwest::Client;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
  let api_key = env::var("API_KEY").unwrap();
  let identity_id = env::var("IDENTITY_ID").unwrap();

  let api_url = format!(
    "https://shadowself.io/api/account/add-account/{}",
    identity_id
  );

  let encrypted_password = "U2FsdGVkX19abcDefGhiJKLmnoPqrStuVwxYz012345=";
  let encrypted_totp = "U2FsdGVkX1+zxcvBNMqwertyUIOPasdfghJKL098765=";

  let payload = json!({
    "username": "forum_reader_12",
    "password": encrypted_password,
    "website": "https://communityforum.org",
    "totp": encrypted_totp,
    "algorithm": "SHA256"
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
