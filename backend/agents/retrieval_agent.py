from config import RERANK_TOP_K
from memory.chroma_store import query_knowledge, rerank_hits
from .state import TraeGuardianState


def retrieval_agent_node(state: TraeGuardianState) -> dict:
    error_log = state.get("error_log", "")
    hits = query_knowledge(error_log)
    ranked = rerank_hits(error_log, hits, top_k=RERANK_TOP_K)

    return {
        "retrieved_context": ranked,
        "status": "Retrieved similar fixes",
    }
