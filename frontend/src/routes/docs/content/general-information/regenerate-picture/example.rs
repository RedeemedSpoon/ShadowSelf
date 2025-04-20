use std::env;
use std::error::Error;
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    // Requires API_KEY and IDENTITY_ID environment variables
    let api_key = env::var("API_KEY").expect("API_KEY not set");
    let identity_id = env::var("IDENTITY_ID").expect("IDENTITY_ID not set");

    let api_url = format!("https://shadowself.io/api/identity/regenerate-picture/{}", identity_id);

    let payload = json!({ "age": 25, "ethnicity": "asian" });

    let client = reqwest::Client::new();

    let res = client
        .patch(&api_url)
        .bearer_auth(api_key)
        .json(&payload)
        .send()
        .await?;

    println!("{}", res.text().await?);

    Ok(())
}
