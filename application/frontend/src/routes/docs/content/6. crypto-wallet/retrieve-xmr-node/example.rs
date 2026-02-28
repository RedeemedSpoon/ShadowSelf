use std::env;
use reqwest::Client;

#[tokio::main]
async fn main() {
    let url = format!(
        "https://shadowself.io/api/crypto/xmr-node/{}",
        env::var("IDENTITY_ID").unwrap()
    );
    let response = Client::new()
        .get(&url)
        .bearer_auth(env::var("API_KEY").unwrap())
        .send().await.unwrap().text().await.unwrap();
    println!("{}", response);
}