from typing import TypedDict


class TraeGuardianState(TypedDict, total=False):
    session_id: str
    error_log: str
    project_context: str
    error_type: str
    error_confidence: float
    root_cause_analysis: str
    retrieved_context: list
    proposed_fix: str
    status: str
    user_approved: bool
