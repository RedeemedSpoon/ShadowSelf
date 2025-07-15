use std::env;
use reqwest::Client;

#[tokio::main]
async fn main() {
    let url = format!(
        "https://shadowself.io/api/phone/fetch-conversation/{}",
        env::var("IDENTITY_ID").unwrap()
    );
    let params = [("addressee", "+14155550000")];
    let response = Client::new()
        .get(&url)
        .query(¶ms)
        .bearer_auth(env::var("API_KEY").unwrap())
        .header("Accept", "application/json")
        .send().await.unwrap().text().await.unwrap();
    println!("{}", response);
}
