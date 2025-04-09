use std::env;
use std::error::Error;
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let api_key = env::var("API_KEY").expect("API_KEY not set");
    let identity_id = env::var("IDENTITY_ID").expect("IDENTITY_ID not set");

    let api_url = format!("https://shadowself.io/api/account/edit-account/{}", identity_id);
    let account_entry_id = 101;

    // IMPORTANT: Encrypt new password client-side first
    let new_encrypted_password = "U2FsdGVkX1+UpdatedPassDataLooksLikeThisMaybe==";

    let payload = json!({
        "id": account_entry_id,
        "username": "jd_service_user_revised",
        "password": new_encrypted_password,
        "website": "https://service-updated.example.com"
        // Include "totp", "algorithm" if updating
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
