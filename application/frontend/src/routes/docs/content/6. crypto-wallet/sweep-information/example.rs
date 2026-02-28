use std::env;
use reqwest::Client;
use serde_json::json;

#[tokio::main]
async fn main() {
    let url = format!(
        "https://shadowself.io/api/crypto/sweep-info/{}",
        env::var("IDENTITY_ID").unwrap()
    );
    let response = Client::new()
        .post(&url)
        .bearer_auth(env::var("API_KEY").unwrap())
        .json(&json!({ "coin": "btc", "addresses": ["bc1q...", "bc1p..."] }))
        .send().await.unwrap().text().await.unwrap();
    println!("{}", response);
}