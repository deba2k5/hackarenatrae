import hashlib
import json

from config import RERANK_TOP_K, SEED_DATA_PATH
from memory import chroma_store, mongodb_client
from models.local_models import get_deberta, get_embedder, get_reranker


def seed_chroma_from_json() -> int:
    col = chroma_store.get_collection()
    if col.count() > 0:
        return col.count()

    rows = json.loads(SEED_DATA_PATH.read_text(encoding="utf-8"))
    for i, row in enumerate(rows):
        doc = (
            f"ERROR:\n{row['error_log']}\n\n"
            f"TYPE: {row['error_type']}\n"
            f"ROOT CAUSE: {row['root_cause']}\n"
            f"FIX: {row['proposed_fix']}"
        )
        doc_id = hashlib.sha256(doc.encode()).hexdigest()[:16]
        chroma_store.add_knowledge(
            doc_id=f"seed_{i}_{doc_id}",
            document=doc,
            metadata={
                "error_type": row["error_type"],
                "source": "seed",
            },
        )
    return col.count()


def bootstrap():
    """Load local models, verify MongoDB, seed Chroma if empty."""
    from hf_auth import configure_hf

    configure_hf()
    mongo = mongodb_client.mongo_health()
    if not mongo.get("ok"):
        print(f"[TraeGuardian] MongoDB warning: {mongo.get('error', 'unavailable')}")
    get_embedder()
    get_reranker()

    from config import DEBERTA_MODEL_DIR
    from pathlib import Path

    if not (DEBERTA_MODEL_DIR / "config.json").exists():
        from training.train_deberta import train

        print("[TraeGuardian] Training DeBERTa-v3 on seed data (first run)...")
        train()

    get_deberta()
    count = seed_chroma_from_json()
    print(f"[TraeGuardian] Ready — Chroma docs: {count}, rerank top-k: {RERANK_TOP_K}")
