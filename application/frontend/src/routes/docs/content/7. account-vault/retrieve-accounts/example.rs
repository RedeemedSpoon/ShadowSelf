use std::env;
use reqwest::Client;

#[tokio::main]
async fn main() {
    let url = format!("https://shadowself.io/api/account/{}", env::var("IDENTITY_ID").unwrap());
    let response = Client::new()
        .get(&url)
        .bearer_auth(env::var("API_KEY").unwrap())
        .header("Accept", "application/json")
        .send().await.unwrap().text().await.unwrap();
    println!("{}", response);
}
