import os, asyncio, websockets, json

PING_INTERVAL = 45 # seconds

async def ws_client(uri, headers):
    async for websocket in websockets.connect(uri, extra_headers=headers, ping_interval=None):
        print(f"Connected to {uri.split('/')[-1]}")
        try:
            # Background task to send pings
            async def send_pings():
                while True:
                    await asyncio.sleep(PING_INTERVAL)
                    try: await websocket.send("ping")
                    except websockets.ConnectionClosed: break
            ping_task = asyncio.create_task(send_pings())

            # Listen for messages
            async for message_str in websocket:
                if message_str == 'pong': continue # Silently handle pong
                try:
                    event = json.loads(message_str)
                    print(f"Received event: {event.get('type', 'Unknown')}")
                except json.JSONDecodeError:
                    print(f"Received non-JSON: {message_str[:50]}...")

            # Clean up ping task if message loop exits
            ping_task.cancel()
            try: await ping_task
            except asyncio.CancelledError: pass

        except websockets.ConnectionClosed as e:
            print(f"Connection closed: {e.code}")
        except Exception as e:
            print(f"Error: {e}")
        finally:
             print("Disconnected. Attempting reconnect...")
             await asyncio.sleep(5) # Wait before reconnecting


async def main():
    api_key=os.environ.get('API_KEY'); identity_id=os.environ.get('IDENTITY_ID')
    if not api_key or not identity_id: exit("API_KEY/IDENTITY_ID missing.")
    uri=f"wss://shadowself.io/ws-api/{identity_id}"; headers={'Authorization':f'Bearer {api_key}'}
    await ws_client(uri, headers)

if __name__ == "__main__": asyncio.run(main())
