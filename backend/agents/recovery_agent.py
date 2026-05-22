from .state import TraeGuardianState

FIX_TEMPLATES = {
    "module_not_found": (
        "1. Identify the missing package from the error text.\n"
        "2. Install it: `npm install <pkg>` or `pip install <pkg>`.\n"
        "3. Re-run the command that failed."
    ),
    "syntax_error": (
        "1. Open the file at the line number in the stack trace.\n"
        "2. Fix grammar (quotes, brackets, indentation).\n"
        "3. Run the linter/compiler again."
    ),
    "permission_denied": (
        "1. Check ownership of the path.\n"
        "2. Avoid sudo in app code; fix directory permissions or use a user-writable path."
    ),
    "port_in_use": (
        "1. Find the process: `netstat -ano | findstr :<port>` (Windows) or `lsof -i :<port>` (Unix).\n"
        "2. Stop it or change your app port in config."
    ),
    "env_missing": (
        "1. Copy `.env.example` to `.env`.\n"
        "2. Set the missing variables and restart the terminal/IDE."
    ),
    "build_failed": (
        "1. Read the first error above `npm ERR!` / build summary.\n"
        "2. Clear caches, reinstall deps, rebuild."
    ),
    "type_error": (
        "1. Trace the undefined/null value at the stack line.\n"
        "2. Add guards or fix upstream data."
    ),
    "network_error": (
        "1. Verify host, port, VPN, and DNS.\n"
        "2. Retry when the remote service is up."
    ),
    "unknown": (
        "1. Isolate the first failing command.\n"
        "2. Apply the closest retrieved fix from memory."
    ),
}


def recovery_agent_node(state: TraeGuardianState) -> dict:
    error_type = state.get("error_type", "unknown")
    template = FIX_TEMPLATES.get(error_type, FIX_TEMPLATES["unknown"])
    retrieved = state.get("retrieved_context", [])

    memory_fix = ""
    if retrieved:
        best = retrieved[0]
        doc = best.get("document", "")
        if "FIX:" in doc:
            memory_fix = doc.split("FIX:", 1)[-1].strip()
        else:
            memory_fix = doc[-500:]

    proposed = (
        f"## Recovery plan ({error_type})\n\n"
        f"### Structured steps\n{template}\n\n"
        f"### Analysis\n{state.get('root_cause_analysis', '')}\n\n"
    )
    if memory_fix:
        proposed += f"### Best match from Chroma (BGE reranked)\n{memory_fix}\n"

    return {
        "proposed_fix": proposed,
        "status": "Fix proposed",
    }
