use std::env;
use reqwest::Client;
use serde_json::json;

#[tokio::main]
async fn main() {
    let url = format!(
        "https://shadowself.io/api/identity/regenerate-picture/{}",
        env::var("IDENTITY_ID").unwrap()
    );
    let response = Client::new()
        .patch(&url)
        .bearer_auth(env::var("API_KEY").unwrap())
        .json(&json!({ "age": 25, "ethnicity": "asian" }))
        .send().await.unwrap().text().await.unwrap();
    println!("{}", response);
}
