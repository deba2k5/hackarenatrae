from datetime import datetime, timezone
from typing import Any, Optional

import certifi
from pymongo import MongoClient
from pymongo.collection import Collection

from config import MONGODB_DB, MONGODB_URI

_client: Optional[MongoClient] = None
_mongo_available = True


def get_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(
            MONGODB_URI,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=15000,
            connectTimeoutMS=15000,
        )
    return _client


def is_available() -> bool:
    return mongo_health().get("ok", False)


def get_db():
    return get_client()[MONGODB_DB]


def checkpoints() -> Collection:
    return get_db()["checkpoints"]


def sessions() -> Collection:
    return get_db()["sessions"]


def error_fix_pairs() -> Collection:
    return get_db()["error_fix_pairs"]


def save_checkpoint(name: str, state_dict: dict, status: str = "proposed", session_id: str = "default") -> str:
    doc = {
        "name": name,
        "session_id": session_id,
        "state_data": state_dict,
        "status": status,
        "timestamp": datetime.now(timezone.utc),
    }
    result = checkpoints().insert_one(doc)
    return str(result.inserted_id)


def get_latest_checkpoint(session_id: Optional[str] = None) -> Optional[dict]:
    query = {"session_id": session_id} if session_id else {}
    doc = checkpoints().find(query).sort("timestamp", -1).limit(1)
    row = next(doc, None)
    if not row:
        return None
    return {
        "id": str(row["_id"]),
        "name": row["name"],
        "state": row["state_data"],
        "status": row["status"],
        "timestamp": row["timestamp"].isoformat(),
    }


def save_session_message(session_id: str, role: str, content: str) -> None:
    sessions().insert_one(
        {
            "session_id": session_id,
            "role": role,
            "content": content,
            "timestamp": datetime.now(timezone.utc),
        }
    )


def get_session_history(session_id: str, limit: int = 50) -> list[dict]:
    cursor = (
        sessions()
        .find({"session_id": session_id})
        .sort("timestamp", -1)
        .limit(limit)
    )
    rows = list(cursor)
    rows.reverse()
    return [
        {"role": r["role"], "content": r["content"], "timestamp": r["timestamp"].isoformat()}
        for r in rows
    ]


def save_error_fix_pair(
    error_log: str,
    error_type: str,
    root_cause: str,
    proposed_fix: str,
    metadata: Optional[dict] = None,
) -> str:
    doc = {
        "error_log": error_log,
        "error_type": error_type,
        "root_cause": root_cause,
        "proposed_fix": proposed_fix,
        "metadata": metadata or {},
        "timestamp": datetime.now(timezone.utc),
    }
    result = error_fix_pairs().insert_one(doc)
    return str(result.inserted_id)


def list_error_fix_pairs(limit: int = 200) -> list[dict]:
    cursor = error_fix_pairs().find().sort("timestamp", -1).limit(limit)
    return [
        {
            "error_log": d["error_log"],
            "error_type": d.get("error_type", "unknown"),
            "root_cause": d.get("root_cause", ""),
            "proposed_fix": d.get("proposed_fix", ""),
        }
        for d in cursor
    ]


def mongo_health() -> dict[str, Any]:
    global _mongo_available
    try:
        get_client().admin.command("ping")
        _mongo_available = True
        return {"ok": True, "database": MONGODB_DB}
    except Exception as exc:
        _mongo_available = False
        return {"ok": False, "error": str(exc)}
