use std::env;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    // Requires API_KEY and IDENTITY_ID environment variables
    let api_key = env::var("API_KEY").expect("API_KEY not set");
    let identity_id = env::var("IDENTITY_ID").expect("IDENTITY_ID not set");

    let mailbox = "INBOX";
    // UID of the oldest email currently shown for INBOX
    let since_uid = 104;

    let api_url = format!("https://shadowself.io/api/email/load-more/{}", identity_id);

    let client = reqwest::Client::new();

    let query_params = [("mailbox", mailbox), ("since", &since_uid.to_string())];

    let res = client
        .get(&api_url)
        .query(&query_params) // UID reference point
        .bearer_auth(api_key)
        .header("Accept", "application/json")
        .send()
        .await?;

    println!("{}", res.text().await?);

    Ok(())
}
