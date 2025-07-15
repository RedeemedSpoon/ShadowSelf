use std::env;
use reqwest::{Client, Proxy};

#[tokio::main]
async fn main() {
    let proxy_url = format!("http://{}:{}", env::var("PROXY_HOST").unwrap(), env::var("PROXY_PORT").unwrap());
    let proxy = Proxy::all(&proxy_url).unwrap()
        .basic_auth(&env::var("PROXY_USER").unwrap(), &env::var("PROXY_PASS").unwrap());
    let client = Client::builder().proxy(proxy).build().unwrap();
    let response = client.get("https://httpbin.org/ip").send().await.unwrap().text().await.unwrap();
    println!("{}", response);
}
