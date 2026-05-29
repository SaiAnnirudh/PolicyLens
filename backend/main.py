from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
from websocket_manager import manager

load_dotenv(override=True)

app = FastAPI(
    title="Insurance Policy Simplifier",
    description="AI-powered insurance policy extraction and Q&A",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routes import auth, policies, claims, qa, admin

app.include_router(auth.router)
app.include_router(policies.router)
app.include_router(claims.router)
app.include_router(qa.router)
app.include_router(admin.router)

@app.websocket("/ws/notifications/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            # We don't expect the client to send anything, but we need to keep the connection alive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Insurance API is running"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
