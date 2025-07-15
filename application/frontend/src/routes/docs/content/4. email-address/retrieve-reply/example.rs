use std::env;
use reqwest::Client;

#[tokio::main]
async fn main() {
    let url = format!(
        "https://shadowself.io/api/email/fetch-reply/{}",
        env::var("IDENTITY_ID").unwrap()
    );
    let params = [("uuid", "<a1b2c3d4-e5f6-7890-1234-567890abcdef@shadowself.io>")];
    let response = Client::new()
        .get(&url)
        .query(¶ms)
        .bearer_auth(env::var("API_KEY").unwrap())
        .header("Accept", "application/json")
        .send().await.unwrap().text().await.unwrap();
    println!("{}", response);
}
