from models.local_models import classify_error
from .state import TraeGuardianState

LABEL_ANALYSIS = {
    "module_not_found": (
        "Dependency resolution failed. A required package or module is not installed "
        "or the import path is wrong for the active runtime."
    ),
    "syntax_error": (
        "Source code violates language grammar. Inspect the reported file and line for "
        "unclosed brackets, quotes, or invalid tokens."
    ),
    "permission_denied": (
        "Filesystem permission blocked the operation. The user or process lacks rights "
        "to read/write/execute the target path."
    ),
    "port_in_use": (
        "Network bind failed because the port is already allocated by another process "
        "or container."
    ),
    "env_missing": (
        "Runtime configuration is incomplete — missing environment variable, config file, "
        "or repository context."
    ),
    "build_failed": (
        "Build or package manager lifecycle failed. The first non-warning error above "
        "the summary line is the actionable root cause."
    ),
    "type_error": (
        "Runtime type mismatch — a value is None or the wrong shape when an operation "
        "expects another type."
    ),
    "network_error": (
        "Outbound or inbound network operation failed — DNS, TLS, connection refused, "
        "or timeout."
    ),
    "unknown": (
        "Error pattern not in the trained taxonomy. Use retrieved memory and the stack "
        "trace's first exception line."
    ),
}


def _format_retrieved(ctx: list) -> str:
    if not ctx:
        return "No similar cases in vector memory yet."
    parts = []
    for i, hit in enumerate(ctx, 1):
        score = hit.get("rerank_score", 0)
        et = hit.get("metadata", {}).get("error_type", "?")
        parts.append(f"[{i}] (type={et}, score={score:.3f})\n{hit.get('document', '')[:400]}")
    return "\n\n".join(parts)


def terminal_agent_node(state: TraeGuardianState) -> dict:
    error_log = state.get("error_log", "")
    error_type, confidence = classify_error(error_log)
    base = LABEL_ANALYSIS.get(error_type, LABEL_ANALYSIS["unknown"])
    retrieved = _format_retrieved(state.get("retrieved_context", []))

    analysis = (
        f"DeBERTa-v3 classification: {error_type} (confidence {confidence:.2%})\n\n"
        f"Root cause hypothesis:\n{base}\n\n"
        f"Reranked memory (BGE + Chroma / MiniLM):\n{retrieved}"
    )

    return {
        "error_type": error_type,
        "error_confidence": confidence,
        "root_cause_analysis": analysis,
        "status": "Analyzed",
    }
