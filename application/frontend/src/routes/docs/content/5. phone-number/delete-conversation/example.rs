use std::env;
use reqwest::Client;
use serde_json::json;

#[tokio::main]
async fn main() {
    let url = format!(
        "https://shadowself.io/api/phone/delete-conversation/{}",
        env::var("IDENTITY_ID").unwrap()
    );
    let response = Client::new()
        .delete(&url)
        .bearer_auth(env::var("API_KEY").unwrap())
        .json(&json!({ "addressee": "+14155550000" }))
        .send().await.unwrap().text().await.unwrap();
    println!("{}", response);
}
