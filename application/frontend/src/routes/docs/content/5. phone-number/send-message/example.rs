use std::env;
use reqwest::Client;
use serde_json::json;

#[tokio::main]
async fn main() {
    let url = format!(
        "https://shadowself.io/api/phone/send-message/{}",
        env::var("IDENTITY_ID").unwrap()
    );
    let payload = json!({
      "addressee": "+14155550000",
      "body": "Hello from the Rust API script!"
    });
    let response = Client::new()
        .post(&url)
        .bearer_auth(env::var("API_KEY").unwrap())
        .json(&payload)
        .send().await.unwrap().text().await.unwrap();
    println!("{}", response);
}
