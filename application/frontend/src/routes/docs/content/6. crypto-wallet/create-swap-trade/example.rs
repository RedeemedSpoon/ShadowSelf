use std::env;
use reqwest::Client;
use serde_json::json;

#[tokio::main]
async fn main() {
    let url = format!(
        "https://shadowself.io/api/crypto/swap-trades/{}",
        env::var("IDENTITY_ID").unwrap()
    );
    let payload = json!({
        "tradeID": "trade_12345",
        "coinTo": "xmr",
        "coinFrom": "btc",
        "amount": 0.01,
        "destinationAddress": "44AFFq...",
        "refundAddress": "bc1q...",
        "provider": "ProviderA",
        "isFixed": false
    });
    let response = Client::new()
        .post(&url)
        .bearer_auth(env::var("API_KEY").unwrap())
        .json(&payload)
        .send().await.unwrap().text().await.unwrap();
    println!("{}", response);
}