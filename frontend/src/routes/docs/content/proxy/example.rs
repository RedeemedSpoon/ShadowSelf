use std::env;
use std::error::Error;
use reqwest::Proxy;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error + Send + Sync>> {
    let proxy_host = env::var("PROXY_HOST").expect("PROXY_HOST missing");
    let proxy_port = env::var("PROXY_PORT").expect("PROXY_PORT missing");
    let proxy_user = env::var("PROXY_USER").expect("PROXY_USER missing");
    let proxy_pass = env::var("PROXY_PASS").expect("PROXY_PASS missing");

    let target_url = "https://httpbin.org/ip";
    let proxy_url = format!("https://{}:{}", proxy_host, proxy_port);

    println!("Making request to {} via proxy {}...", target_url, proxy_host);

    let proxy = Proxy::https(&proxy_url)?
        .basic_auth(&proxy_user, &proxy_pass);

    let client = reqwest::Client::builder()
        .proxy(proxy)
        .build()?;

    let res = client.get(target_url).send().await?;

    println!("Status: {}", res.status());
    println!("Response Body:\n{}", res.text().await?);

    Ok(())
}
