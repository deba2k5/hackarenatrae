import os

from config import HF_TOKEN


def configure_hf() -> bool:
    """Authenticate Hugging Face Hub for model downloads (no API LLMs)."""
    if not HF_TOKEN:
        return False

    os.environ["HF_TOKEN"] = HF_TOKEN
    os.environ["HUGGING_FACE_HUB_TOKEN"] = HF_TOKEN

    try:
        from huggingface_hub import login

        login(token=HF_TOKEN, add_to_git_credential=False)
        return True
    except Exception as exc:
        print(f"[TraeGuardian] HuggingFace login warning: {exc}")
        return False
