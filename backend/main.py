import asyncio
import json
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from agents.orchestrator import NODE_LABELS, orchestrator_app
from memory import chroma_store, mongodb_client
from models.local_models import models_health
from startup import bootstrap


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except Exception:
                pass


manager = ConnectionManager()
_models_ready = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _models_ready
    await asyncio.to_thread(bootstrap)
    _models_ready = True
    yield


app = FastAPI(title="TraeGuardian AI Engine", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "message": "TraeGuardian AI Engine is running",
        "models_ready": _models_ready,
        "stack": ["MongoDB", "ChromaDB", "all-MiniLM-L6-v2", "BAAI/bge-reranker", "DeBERTa-v3"],
    }


@app.get("/health")
async def health():
    from config import HF_TOKEN
    from hf_auth import configure_hf

    return {
        "status": "ok" if _models_ready else "starting",
        "models_ready": _models_ready,
        "huggingface": {"configured": bool(HF_TOKEN)},
        "mongodb": mongodb_client.mongo_health(),
        "chroma": chroma_store.chroma_health(),
        "models": models_health(),
    }


async def run_orchestration(error_log: str, session_id: str, project_context: str):
    initial_state = {
        "error_log": error_log,
        "project_context": project_context,
        "session_id": session_id,
        "user_approved": False,
    }

    final_state = {}
    async for event in orchestrator_app.astream(initial_state):
        for node_name, update in event.items():
            label, status_msg = NODE_LABELS.get(node_name, (node_name, "Working..."))
            await manager.broadcast(
                json.dumps(
                    {
                        "type": "agent_status",
                        "agent": label,
                        "status": status_msg,
                    }
                )
            )
            final_state.update(update)

    for label in ("Terminal", "Recovery", "Memory"):
        await manager.broadcast(
            json.dumps({"type": "agent_status", "agent": label, "status": "Online"})
        )

    return final_state


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)

            if payload.get("type") == "terminal_error":
                error_log = payload.get("error_log", "Unknown Error")
                session_id = payload.get("session_id", "default")
                project_context = payload.get(
                    "project_context", "TraeGuardian Workspace"
                )

                mongodb_client.save_session_message(
                    session_id, "user", error_log[:2000]
                )

                final_state = await run_orchestration(
                    error_log, session_id, project_context
                )
                proposed_fix = final_state.get("proposed_fix", "No fix generated.")

                await manager.broadcast(
                    json.dumps(
                        {
                            "type": "agent_response",
                            "agent": "Recovery",
                            "message": proposed_fix,
                            "error_type": final_state.get("error_type"),
                            "confidence": final_state.get("error_confidence"),
                        }
                    )
                )

            elif payload.get("type") == "restore_session":
                session_id = payload.get("session_id", "default")
                latest = mongodb_client.get_latest_checkpoint(session_id)
                if latest:
                    await manager.broadcast(
                        json.dumps(
                            {
                                "type": "agent_response",
                                "agent": "Memory",
                                "message": (
                                    f"MongoDB checkpoint: {latest['name']} "
                                    f"({latest['status']}) at {latest['timestamp']}"
                                ),
                            }
                        )
                    )
                else:
                    await manager.broadcast(
                        json.dumps(
                            {
                                "type": "agent_response",
                                "agent": "Memory",
                                "message": "No MongoDB checkpoints for this session.",
                            }
                        )
                    )

            elif payload.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        manager.disconnect(websocket)
