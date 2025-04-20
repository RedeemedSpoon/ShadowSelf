use std::env;
use std::error::Error;
use serde_json::json;

// Assume 'your_encryption_function' exists

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let api_key = env::var("API_KEY").expect("API_KEY not set");
    let identity_id = env::var("IDENTITY_ID").expect("IDENTITY_ID not set");

    let api_url = format!("https://shadowself.io/api/account/add-account/{}", identity_id);

    // IMPORTANT: Encrypt plain data client-side first
    let encrypted_password = "U2FsdGVkX19abcDefGhiJKLmnoPqrStuVwxYz012345=";
    let encrypted_totp = "U2FsdGVkX1+zxcvBNMqwertyUIOPasdfghJKL098765=";

    let payload = json!({
        "username": "forum_reader_12",
        "password": encrypted_password,
        "website": "https://communityforum.org",
        "totp": encrypted_totp,
        "algorithm": "SHA256"
    });

    let client = reqwest::Client::new();

    let res = client
        .post(&api_url)
        .bearer_auth(api_key)
        .json(&payload)
        .send()
        .await?;

    println!("{}", res.text().await?);

    Ok(())
}
