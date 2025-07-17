use std::env;
use reqwest::Client;

#[tokio::main]
async fn main() {
    let response = Client::new()
        .get("https://shadowself.io/api/")
        .bearer_auth(env::var("API_KEY").unwrap())
        .header("Accept", "application/json")
        .send().await.unwrap().text().await.unwrap();
    println!("{}", response);
}
