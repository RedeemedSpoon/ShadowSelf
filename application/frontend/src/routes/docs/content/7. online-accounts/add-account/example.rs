use std::env;
use reqwest::Client;
use serde_json::json;

#[tokio::main]
async fn main() {
    let url = format!(
        "https://shadowself.io/api/account/add-account/{}",
        env::var("IDENTITY_ID").unwrap()
    );
    let payload = json!({
        "username": "forum_reader_12",
        "password": "U2FsdGVkX19abcDefGhiJKLmnoPqrStuVwxYz012345=",
        "website": "https://communityforum.org",
        "totp": "U2FsdGVkX1+zxcvBNMqwertyUIOPasdfghJKL098765=",
        "algorithm": "SHA256"
    });
    let response = Client::new()
        .post(&url)
        .bearer_auth(env::var("API_KEY").unwrap())
        .json(&payload)
        .send().await.unwrap().text().await.unwrap();
    println!("{}", response);
}
