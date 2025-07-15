use std::env;
use reqwest::Client;
use serde_json::json;

#[tokio::main]
async fn main() {
    let url = format!(
        "https://shadowself.io/api/email/forward-email/{}",
        env::var("IDENTITY_ID").unwrap()
    );
    let response = Client::new()
        .post(&url)
        .bearer_auth(env::var("API_KEY").unwrap())
        .json(&json!({"uid": 105, "forward": "forward.recipient@another.com"}))
        .send().await.unwrap().text().await.unwrap();
    println!("{}", response);
}
