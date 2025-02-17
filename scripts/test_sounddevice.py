import asyncio
import websockets
import numpy as np
import sounddevice as sd
from queue import Queue, Empty

async def handler(websocket, path=None):
    sample_rate = 44100
    channels = 1
    blocksize = 128

    # Reception queue
    audio_queue = Queue()

    # Audio stream callback
    def audio_callback(outdata, frames, time, status):
        if status:
            print(f"Stream statut: {status}")
        try:
            # Get queue data
            chunk = audio_queue.get_nowait()
            # Fulfill audio stream
            outdata[:len(chunk)] = chunk.reshape(-1, channels)
            # 0 padding if needed
            if len(chunk) < frames:
                outdata[len(chunk):] = 0
        except Empty:
            outdata.fill(0)

    # Output audio stream
    with sd.OutputStream(
        samplerate=sample_rate,
        channels=channels,
        dtype='int16',
        blocksize=blocksize,
        callback=audio_callback
    ) as stream:
        print("Audio stream started")
        try:
            async for message in websocket:
                data = np.frombuffer(message, dtype=np.int16)
                # Push data in queue
                audio_queue.put(data)
        except websockets.ConnectionClosed:
            print("Client connected")
        except Exception as e:
            print(f"Error : {e}")
        finally:
            print("Audio stream stopped")

async def main():
    async with websockets.serve(handler, "0.0.0.0", 9000):
        print("WebSocket server started")
        await asyncio.Future()  # Maintain in active state

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Server stopped")
