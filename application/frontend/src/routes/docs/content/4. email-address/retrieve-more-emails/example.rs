use std::{env, error::Error};
use reqwest::Client;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
  let api_key = env::var("API_KEY").unwrap();
  let identity_id = env::var("IDENTITY_ID").unwrap();
  let mailbox = "INBOX";
  let since_uid = 104;

  let api_url = format!(
    "https://shadowself.io/api/email/load-more/{}",
    identity_id
  );
  let client = Client::new();
  let query_params = [
    ("mailbox", mailbox),
    ("since", &since_uid.to_string())
  ];

  let response = client
    .get(&api_url)
    .query(&query_params)
    .bearer_auth(api_key)
    .header("Accept", "application/json")
    .send()
    .await?
    .error_for_status()?;

  println!("{}", response.text().await?);

  Ok(())
}
