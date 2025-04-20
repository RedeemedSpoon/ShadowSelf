use std::env;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    // Requires API_KEY and IDENTITY_ID environment variables
    let api_key = env::var("API_KEY").expect("API_KEY not set");
    let identity_id = env::var("IDENTITY_ID").expect("IDENTITY_ID not set");

    let addressee_phone = "+14155550000";

    let api_url = format!("https://shadowself.io/api/phone/fetch-conversation/{}", identity_id);

    let client = reqwest::Client::new();

    let query_params = [("addressee", addressee_phone)];

    let res = client
        .get(&api_url)
        .query(&query_params)
        .bearer_auth(api_key)
        .header("Accept", "application/json")
        .send()
        .await?;

    println!("{}", res.text().await?);

    Ok(())
}
