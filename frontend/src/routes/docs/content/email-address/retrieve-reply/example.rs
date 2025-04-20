use std::env;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    // Requires API_KEY and IDENTITY_ID environment variables
    let api_key = env::var("API_KEY").expect("API_KEY not set");
    let identity_id = env::var("IDENTITY_ID").expect("IDENTITY_ID not set");

    let email_uuid = "<a1b2c3d4-e5f6-7890-1234-567890abcdef@shadowself.io>";

    let api_url = format!("https://shadowself.io/api/email/fetch-reply/{}", identity_id);

    let client = reqwest::Client::new();

    let res = client
        .get(&api_url)
        .query(&[("uuid", email_uuid)])
        .bearer_auth(api_key)
        .header("Accept", "application/json")
        .send()
        .await?;

    println!("{}", res.text().await?);

    Ok(())
}
