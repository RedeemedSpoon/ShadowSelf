use std::env;
use reqwest::Client;
use serde_json::json;

#[tokio::main]
async fn main() {
    let url = format!(
        "https://shadowself.io/api/email/save-draft/{}",
        env::var("IDENTITY_ID").unwrap()
    );
    let payload = json!({
      "to": "recipient@example.com",
      "subject": "Updated Draft Subject",
      "body": "Continuing to write this email...",
      "attachments": [ {"filename": "idea.txt", "data": "VGhpcyBpcyBteSB..."} ],
      "draft": 45
    });
    let response = Client::new()
        .put(&url)
        .bearer_auth(env::var("API_KEY").unwrap())
        .json(&payload)
        .send().await.unwrap().text().await.unwrap();
    println!("{}", response);
}
