use std::env;
use reqwest::Client;
use serde_json::json;

#[tokio::main]
async fn main() {
    let url = format!(
        "https://shadowself.io/api/account/edit-account/{}",
        env::var("IDENTITY_ID").unwrap()
    );
    let payload = json!({
        "id": 101,
        "username": "jd_service_user_revised",
        "password": "U2FsdGVkX1+UpdatedPassDataLooksLikeThisMaybe==",
        "website": "https://service-updated.example.com"
    });
    let response = Client::new()
        .put(&url)
        .bearer_auth(env::var("API_KEY").unwrap())
        .json(&payload)
        .send().await.unwrap().text().await.unwrap();
    println!("{}", response);
}
