use std::{env, error::Error};
use reqwest::{Client, Proxy};

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let proxy_host = env::var("PROXY_HOST").unwrap();
    let proxy_port = env::var("PROXY_PORT").unwrap();
    let proxy_user = env::var("PROXY_USER").unwrap();
    let proxy_pass = env::var("PROXY_PASS").unwrap();

    let target_url = "https://httpbin.org/ip";
    let proxy_url_str = format!("http://{}:{}", proxy_host, proxy_port);

    let proxy = Proxy::all(&proxy_url_str)?
        .basic_auth(&proxy_user, &proxy_pass);

    let client = Client::builder().proxy(proxy).build()?;
    let response = client.get(target_url).send().await?;

    if !response.status().is_success() {
        let status = response.status();
        let err_text = response.text().await?;
        eprintln!("API error: {}\n{}", status, err_text);
        return Err(Box::from(format!("API error: {}", status)));
    }

    let body_text = response.text().await?;
    println!("{}", body_text);

    Ok(())
}
