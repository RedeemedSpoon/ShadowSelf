use std::env;
use reqwest::Client;
use serde_json::json;

#[tokio::main]
async fn main() {
    let url = format!(
        "https://shadowself.io/api/crypto/update-blob/{}",
        env::var("IDENTITY_ID").unwrap()
    );
    let response = Client::new()
        .put(&url)
        .bearer_auth(env::var("API_KEY").unwrap())
        .json(&json!({ "blob": "U2FsdGVkX19nb..." }))
        .send().await.unwrap().text().await.unwrap();
    println!("{}", response);
}