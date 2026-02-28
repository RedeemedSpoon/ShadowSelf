use std::env;
use reqwest::Client;

#[tokio::main]
async fn main() {
    let url = format!(
        "https://shadowself.io/api/crypto/swap-rates/{}",
        env::var("IDENTITY_ID").unwrap()
    );
    let response = Client::new()
        .get(&url)
        .query(&[("coinFrom", "btc"), ("coinTo", "xmr"), ("amount", "0.01")])
        .bearer_auth(env::var("API_KEY").unwrap())
        .send().await.unwrap().text().await.unwrap();
    println!("{}", response);
}