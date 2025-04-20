use std::env;
use std::error::Error;
use serde_json::json;

// Assume your_new_encryption_function exists

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let api_key = env::var("API_KEY").expect("API_KEY not set");
    let identity_id = env::var("IDENTITY_ID").expect("IDENTITY_ID not set");

    let api_url = format!("https://shadowself.io/api/account/update-encryption/{}", identity_id);

    // IMPORTANT: Fetch, decrypt old, re-encrypt new client-side first
    let re_encrypted_pass_1 = "U2FsdGVkX1+NewKeyEncPassDataOne==";
    let re_encrypted_totp_1 = "U2FsdGVkX1+NewKeyEncTotpDataOne==";
    let re_encrypted_pass_2 = "U2FsdGVkX1+NewKeyEncPassDataTwo==";

    let payload = json!({
        "accounts": [
            { "id": 101, "password": re_encrypted_pass_1, "totp": re_encrypted_totp_1 },
            { "id": 102, "password": re_encrypted_pass_2 }
        ]
    });

    let client = reqwest::Client::new();

    let res = client
        .put(&api_url)
        .bearer_auth(api_key)
        .json(&payload)
        .send()
        .await?;

    println!("{}", res.text().await?);

    Ok(())
}
