from pathlib import Path
from typing import Optional

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from config import (
    DEBERTA_BASE,
    DEBERTA_MODEL_DIR,
    EMBEDDING_MODEL,
    RERANKER_MODEL,
)

_embedder = None
_reranker = None
_deberta_tokenizer = None
_deberta_model = None
_label2id: Optional[dict] = None
_id2label: Optional[dict] = None


def get_embedder():
    global _embedder
    if _embedder is None:
        from sentence_transformers import SentenceTransformer

        _embedder = SentenceTransformer(EMBEDDING_MODEL)
    return _embedder


def embed_texts(texts: list[str]) -> list[list[float]]:
    model = get_embedder()
    vectors = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    return vectors.tolist()


def get_reranker():
    global _reranker
    if _reranker is None:
        from FlagEmbedding import FlagReranker

        use_fp16 = torch.cuda.is_available()
        _reranker = FlagReranker(RERANKER_MODEL, use_fp16=use_fp16)
    return _reranker


def _load_label_maps():
    global _label2id, _id2label
    if _label2id is not None:
        return
    labels_path = DEBERTA_MODEL_DIR / "labels.json"
    if labels_path.exists():
        import json

        data = json.loads(labels_path.read_text(encoding="utf-8"))
        _label2id = data["label2id"]
        _id2label = {int(k): v for k, v in data["id2label"].items()}
    else:
        _label2id = {"unknown": 0}
        _id2label = {0: "unknown"}


def get_deberta():
    global _deberta_tokenizer, _deberta_model
    _load_label_maps()
    if _deberta_model is None:
        model_path = DEBERTA_MODEL_DIR
        if (model_path / "config.json").exists():
            _deberta_tokenizer = AutoTokenizer.from_pretrained(str(model_path))
            _deberta_model = AutoModelForSequenceClassification.from_pretrained(str(model_path))
        else:
            raise FileNotFoundError(
                f"DeBERTa model not found at {model_path}. Run: python -m training.train_deberta"
            )
        _deberta_model.eval()
    return _deberta_tokenizer, _deberta_model


def classify_error(error_log: str) -> tuple[str, float]:
    tokenizer, model = get_deberta()
    text = error_log[:512]
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad():
        logits = model(**inputs).logits
        probs = torch.softmax(logits, dim=-1)[0]
        pred_id = int(torch.argmax(probs).item())
        confidence = float(probs[pred_id].item())
    label = _id2label.get(pred_id, "unknown") if _id2label else "unknown"
    return label, confidence


def models_health() -> dict:
    status = {
        "embedding": EMBEDDING_MODEL,
        "reranker": RERANKER_MODEL,
        "deberta_path": str(DEBERTA_MODEL_DIR),
        "deberta_ready": (DEBERTA_MODEL_DIR / "config.json").exists(),
        "cuda": torch.cuda.is_available(),
    }
    try:
        get_embedder()
        status["embedder_loaded"] = True
    except Exception as exc:
        status["embedder_loaded"] = False
        status["embedder_error"] = str(exc)
    try:
        get_reranker()
        status["reranker_loaded"] = True
    except Exception as exc:
        status["reranker_loaded"] = False
        status["reranker_error"] = str(exc)
    return status
