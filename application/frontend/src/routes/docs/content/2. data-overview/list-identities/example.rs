use std::{env, error::Error};
use reqwest::Client;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let api_key = env::var("API_KEY").unwrap();
    let api_url = "https://shadowself.io/api/";

    let client = Client::new();
    let response = client
        .get(api_url)
        .bearer_auth(api_key)
        .header("Accept", "application/json")
        .send()
        .await?
        .error_for_status()?;

    let body_text = response.text().await?;
    println!("{}", body_text);

    Ok(())
}
