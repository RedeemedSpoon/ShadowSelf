use std::{env, error::Error};
use reqwest::Client;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
  let api_key = env::var("API_KEY").unwrap();
  let identity_id = env::var("IDENTITY_ID").unwrap();
  let email_uuid = "<a1b2c3d4-e5f6-7890-1234-567890abcdef@shadowself.io>";

  let api_url = format!(
    "https://shadowself.io/api/email/fetch-reply/{}",
    identity_id
  );
  let client = Client::new();

  let response = client
    .get(&api_url)
    .query(&[("uuid", email_uuid)])
    .bearer_auth(api_key)
    .header("Accept", "application/json")
    .send()
    .await?
    .error_for_status()?;

  println!("{}", response.text().await?);

  Ok(())
}
