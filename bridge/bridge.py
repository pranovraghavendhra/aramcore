import subprocess
import threading
import json
import time
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# stores last 200 events in memory
event_log = []
clients = []

def parse_event(line):
    try:
        line = line.strip()
        if not line.startswith("EVT:"):
            return None
        parts = line.split(":")
        if len(parts) < 2:
            return None
        evt_type = parts[1]
        evt = {
            "type":      evt_type,
            "pid":       "0",
            "name":      "",
            "state":     "",
            "size":      "0",
            "used":      "0",
            "timestamp": datetime.now().isoformat()
        }
        for part in parts[2:]:
            if "=" in part:
                k, v = part.split("=", 1)
                if k == "pid":   evt["pid"]   = v
                if k == "name":  evt["name"]  = v
                if k == "state": evt["state"] = v
                if k == "size":  evt["size"]  = v
                if k == "used":  evt["used"]  = v
        return evt
    except:
        return None

async def broadcast(evt):
    dead = []
    for ws in clients:
        try:
            await ws.send_json(evt)
        except:
            dead.append(ws)
    for ws in dead:
        clients.remove(ws)

def run_kernel():
    # runs kernel in qemu, reads serial line by line
    cmd = [
        "qemu-system-x86_64",
        "-kernel", "../kernel/kernel.bin",
        "-serial", "stdio",
        "-display", "none"
    ]
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True
    )
    for line in proc.stdout:
        evt = parse_event(line)
        if evt:
            event_log.append(evt)
            if len(event_log) > 200:
                event_log.pop(0)
            print(f"[kernel] {evt['type']} pid={evt['pid']} name={evt['name']} state={evt['state']}")

@app.on_event("startup")
def startup():
    t = threading.Thread(target=run_kernel, daemon=True)
    t.start()

@app.get("/events")
def get_events():
    return {"events": event_log}

@app.get("/status")
def get_status():
    return {"status": "running", "event_count": len(event_log)}

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    clients.append(ws)
    # send existing events on connect
    for evt in event_log:
        await ws.send_json(evt)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        clients.remove(ws)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)