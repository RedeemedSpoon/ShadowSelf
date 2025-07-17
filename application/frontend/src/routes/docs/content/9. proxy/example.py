import os
import requests

proxy_url = f"http://{os.environ['PROXY_USER']}:{os.environ['PROXY_PASS']}@{os.environ['PROXY_HOST']}:{os.environ['PROXY_PORT']}"
response = requests.get(
    "https://httpbin.org/ip",
    proxies={"https": proxy_url}
)
print(response.json())
