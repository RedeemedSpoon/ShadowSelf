import os, asyncio, websockets, json

async def listen():
    uri = f"wss://shadowself.io/ws-api/{os.environ['IDENTITY_ID']}"
    headers = {'Authorization': f"Bearer {os.environ['API_KEY']}"}
    async with websockets.connect(
        uri, extra_headers=headers, ping_interval=45
    ) as websocket:
        async for message in websocket:
            event = json.loads(message)
            if event.get('type'):
                print(f"Received event: {event['type']}")

asyncio.run(listen())
