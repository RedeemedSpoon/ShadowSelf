import os
import requests
import json

proxy_host = os.environ.get('PROXY_HOST')
proxy_port = os.environ.get('PROXY_PORT')
proxy_user = os.environ.get('PROXY_USER')
proxy_pass = os.environ.get('PROXY_PASS')

if not all([proxy_host, proxy_port, proxy_user, proxy_pass]):
    print("Error: PROXY_HOST, PROXY_PORT, PROXY_USER, PROXY_PASS env vars must be set.")
    exit(1)

proxy_url = f"https://{proxy_user}:{proxy_pass}@{proxy_host}:{proxy_port}"
proxies = {
   "http": proxy_url,
   "https": proxy_url,
}

target_url = "https://httpbin.org/ip"

print(f"Making request to {target_url} via proxy {proxy_host}...")

try:
    response = requests.get(target_url, proxies=proxies)
    response.raise_for_status()

    print("Response:")
    print(json.dumps(response.json(), indent=2))
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
except Exception as e:
    print(f"An error occurred: {e}")
