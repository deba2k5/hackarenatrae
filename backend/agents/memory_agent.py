import hashlib

from memory import chroma_store, mongodb_client
from .state import TraeGuardianState


def memory_store_node(state: TraeGuardianState) -> dict:
    error_log = state.get("error_log", "")
    error_type = state.get("error_type", "unknown")
    root_cause = state.get("root_cause_analysis", "")
    proposed_fix = state.get("proposed_fix", "")
    session_id = state.get("session_id", "default")

    doc = (
        f"ERROR:\n{error_log}\n\n"
        f"TYPE: {error_type}\n"
        f"ROOT CAUSE: {root_cause[:800]}\n"
        f"FIX: {proposed_fix[:800]}"
    )
    doc_id = hashlib.sha256((error_log + proposed_fix).encode()).hexdigest()[:20]

    chroma_store.add_knowledge(
        doc_id=f"live_{doc_id}",
        document=doc,
        metadata={"error_type": error_type, "source": "live"},
    )

    mongo_note = ""
    try:
        if mongodb_client.is_available():
            mongodb_client.save_error_fix_pair(
                error_log=error_log,
                error_type=error_type,
                root_cause=root_cause,
                proposed_fix=proposed_fix,
            )
            mongodb_client.save_checkpoint(
                name="Recovery Event",
                state_dict={
                    "error": error_log,
                    "error_type": error_type,
                    "fix": proposed_fix,
                },
                status="proposed",
                session_id=session_id,
            )
            mongodb_client.save_session_message(
                session_id, "system", f"Stored fix for {error_type}"
            )
            mongo_note = "MongoDB + Chroma"
        else:
            mongo_note = "Chroma only (MongoDB unreachable — check Atlas IP whitelist)"
    except Exception as exc:
        mongo_note = f"Chroma only (MongoDB error: {exc})"

    return {"status": f"Persisted to {mongo_note}"}
