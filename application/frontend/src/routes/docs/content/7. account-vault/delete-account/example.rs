use std::env;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let response = reqwest::Client::new()
        .request(reqwest::Method::DELETE, format!("https://shadowself.io/api/account/delete-account/{}", env::var("IDENTITY_ID")?))
        .bearer_auth(env::var("API_KEY")?)
        .header("Content-Type", "application/json")
        .body(r#"{
  "encryptionVersion": 1,
  "id": 101
}"#)
        .send().await?;
    let status = response.status();
    let body = response.text().await?;
    if !status.is_success() { return Err(format!("{status}: {body}").into()); }
    println!("{body}");
    Ok(())
}
