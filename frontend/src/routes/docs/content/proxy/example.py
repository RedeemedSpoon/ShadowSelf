import os
import requests
import json

proxy_host = os.environ['PROXY_HOST']
proxy_port = os.environ['PROXY_PORT']
proxy_user = os.environ['PROXY_USER']
proxy_pass = os.environ['PROXY_PASS']

proxy_url = f"http://{proxy_user}:{proxy_pass}@{proxy_host}:{proxy_port}"
proxies = {"http": proxy_url, "https": proxy_url}
target_url = "https://httpbin.org/ip"

try:
    response = requests.get(target_url, proxies=proxies)
    response.raise_for_status()
    print(json.dumps(response.json(), indent=2))
except requests.exceptions.HTTPError as e:
    error_body = e.response.text
    try:
        error_json = e.response.json()
        error_body = json.dumps(error_json, indent=2)
    except json.JSONDecodeError:
        pass
    print(f"API error: {e.response.status_code}\n{error_body}")
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
