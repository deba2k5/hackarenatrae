from langgraph.graph import StateGraph, END

from .memory_agent import memory_store_node
from .recovery_agent import recovery_agent_node
from .retrieval_agent import retrieval_agent_node
from .state import TraeGuardianState
from .terminal_agent import terminal_agent_node


def create_orchestrator():
    workflow = StateGraph(TraeGuardianState)

    workflow.add_node("retrieval", retrieval_agent_node)
    workflow.add_node("terminal_agent", terminal_agent_node)
    workflow.add_node("recovery_agent", recovery_agent_node)
    workflow.add_node("memory_store", memory_store_node)

    workflow.set_entry_point("retrieval")
    workflow.add_edge("retrieval", "terminal_agent")
    workflow.add_edge("terminal_agent", "recovery_agent")
    workflow.add_edge("recovery_agent", "memory_store")
    workflow.add_edge("memory_store", END)

    return workflow.compile()


orchestrator_app = create_orchestrator()

NODE_LABELS = {
    "retrieval": ("Memory", "Retrieving from Chroma + BGE reranker..."),
    "terminal_agent": ("Terminal", "DeBERTa-v3 root cause analysis..."),
    "recovery_agent": ("Recovery", "Composing recovery plan..."),
    "memory_store": ("Memory", "Persisting to MongoDB + Chroma..."),
}
