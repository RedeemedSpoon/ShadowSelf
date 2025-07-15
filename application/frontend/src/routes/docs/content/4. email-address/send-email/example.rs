use std::env;
use reqwest::Client;
use serde_json::json;

#[tokio::main]
async fn main() {
    let url = format!(
        "https://shadowself.io/api/email/send-email/{}",
        env::var("IDENTITY_ID").unwrap()
    );
    let payload = json!({
      "to": "recipient@example.com",
      "subject": "API Test Email",
      "body": "This is the <b>HTML</b> body.",
      "inReplyTo": "<f0e9d8c7-b6a5-4321-fedc-ba0987654321@example.org>",
      "references": ["<f0e9d8c7-b6a5-4321-fedc-ba0987654321@example.org>"],
      "attachments": [ {"filename": "document.pdf", "data": "JVBERi0xLjcK..."} ],
      "draft": 123
    });
    let response = Client::new()
        .post(&url)
        .bearer_auth(env::var("API_KEY").unwrap())
        .json(&payload)
        .send().await.unwrap().text().await.unwrap();
    println!("{}", response);
}
