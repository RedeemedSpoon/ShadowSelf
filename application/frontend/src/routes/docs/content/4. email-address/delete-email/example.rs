use std::env;
use reqwest::Client;
use serde_json::json;

#[tokio::main]
async fn main() {
    let url = format!(
        "https://shadowself.io/api/email/delete-email/{}",
        env::var("IDENTITY_ID").unwrap()
    );
    let response = Client::new()
        .delete(&url)
        .bearer_auth(env::var("API_KEY").unwrap())
        .json(&json!({"mailbox": "INBOX", "uid": 105}))
        .send().await.unwrap().text().await.unwrap();
    println!("{}", response);
}
