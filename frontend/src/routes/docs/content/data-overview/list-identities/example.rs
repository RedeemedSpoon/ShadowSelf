use std::env;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let api_key = env::var("API_KEY").expect("API_KEY not set");
    let api_url = "https://shadowself.io/api/";

    let client = reqwest::Client::new();
    let response = client
        .get(api_url)
        .bearer_auth(api_key)
        .header("Accept", "application/json")
        .send()
        .await?;

    let body_text = response.text().await?;
    println!("{}", body_text); // Print response body

    Ok(())
}
