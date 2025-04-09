use std::env;
use std::error::Error;
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let api_key = env::var("API_KEY").expect("API_KEY not set");
    let identity_id = env::var("IDENTITY_ID").expect("IDENTITY_ID not set");

    let api_url = format!("https://shadowself.io/api/phone/send-message/{}", identity_id);

    let payload = json!({
        "addressee": "+14155550000",
        "body": "Hello from the Rust API script!"
    });

    let client = reqwest::Client::new();

    let res = client
        .post(&api_url)
        .bearer_auth(api_key)
        .json(&payload)
        .send()
        .await?;

    println!("{}", res.text().await?);

    Ok(())
}
