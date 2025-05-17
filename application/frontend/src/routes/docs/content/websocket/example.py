import os
import asyncio
import websockets
import json

PING_INTERVAL_S = 45

async def handle_messages(websocket):
    async for message_str in websocket:
        try:
            event = json.loads(message_str)
            if isinstance(event, dict) and event.get('type'):
                print(f"Received event: {event.get('type')}")
        except json.JSONDecodeError:
            pass

async def ws_client_manager(uri, headers):
    while True:
        try:
            async with websockets.connect(
                uri, extra_headers=headers, ping_interval=PING_INTERVAL_S
            ) as websocket:
                await handle_messages(websocket)
        except websockets.ConnectionClosedError as e:
            print(f"Connection closed error: {e.code} {e.reason}")
        except websockets.ConnectionClosedOK:
            print("Connection closed normally.")
            break
        except Exception as e:
            print(f"Connection error: {e}")
        print("Attempting to reconnect in 5 seconds...")
        await asyncio.sleep(5)

async def main():
    api_key = os.environ['API_KEY']
    identity_id = os.environ['IDENTITY_ID']
    uri = f"wss://shadowself.io/ws-api/{identity_id}"
    headers = {'Authorization': f'Bearer {api_key}'}
    await ws_client_manager(uri, headers)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Exiting...")
