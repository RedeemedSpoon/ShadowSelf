use std::env;
use std::error::Error;
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let api_key = env::var("API_KEY").expect("API_KEY not set");
    let identity_id = env::var("IDENTITY_ID").expect("IDENTITY_ID not set");

    let api_url = format!("https://shadowself.io/api/email/send-email/{}", identity_id);

    let pdf_data = "JVBERi0xLjcK...";

    let payload = json!({
        "to": "recipient@example.com",
        "subject": "API Test Email",
        "body": "This is the <b>HTML</b> body.",
        "inReplyTo": "<f0e9d8c7-b6a5-4321-fedc-ba0987654321@example.org>",
        "references": ["<f0e9d8c7-b6a5-4321-fedc-ba0987654321@example.org>"],
        "attachments": [ {"filename": "document.pdf", "data": pdf_data} ],
        "draft": 123
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
