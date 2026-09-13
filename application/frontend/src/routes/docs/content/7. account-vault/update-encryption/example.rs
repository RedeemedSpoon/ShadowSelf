use std::env;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let response = reqwest::Client::new()
        .request(reqwest::Method::PUT, format!("https://shadowself.io/api/account/update-encryption/{}", env::var("IDENTITY_ID")?))
        .bearer_auth(env::var("API_KEY")?)
        .header("Content-Type", "application/json")
        .body(r#"{
  "vaultRevision": 1,
  "accounts": [
    {
      "id": 101,
      "password": "v1.AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=",
      "totp": null
    }
  ],
  "blob": "v1.AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=",
  "keys": {
    "address": "v1.AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=",
    "viewKey": "v1.AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=",
    "spendKey": "v1.AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE="
  }
}"#)
        .send().await?;
    let status = response.status();
    let body = response.text().await?;
    if !status.is_success() { return Err(format!("{status}: {body}").into()); }
    println!("{body}");
    Ok(())
}
