use std::env;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error + Send + Sync>> {
    let api_key = env::var("API_KEY").expect("API_KEY missing");
    let api_url = "https://shadowself.io/api/proxy";
    let client = reqwest::Client::new();

    let res = client.get(api_url)
        .bearer_auth(api_key)
        .header("Accept", "application/json")
        .send().await?;

    println!("{}", res.text().await?);
    Ok(())
}
