from typing import Optional

import chromadb
from chromadb.config import Settings

from config import CHROMA_COLLECTION, CHROMA_DIR, RETRIEVE_TOP_K
from models.local_models import embed_texts, get_reranker

_collection = None
_client = None


def get_chroma_client() -> chromadb.PersistentClient:
    global _client
    if _client is None:
        CHROMA_DIR.mkdir(parents=True, exist_ok=True)
        _client = chromadb.PersistentClient(
            path=str(CHROMA_DIR),
            settings=Settings(anonymized_telemetry=False),
        )
    return _client


def get_collection():
    global _collection
    if _collection is None:
        client = get_chroma_client()
        _collection = client.get_or_create_collection(
            name=CHROMA_COLLECTION,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def add_knowledge(
    doc_id: str,
    document: str,
    metadata: dict,
    embedding: Optional[list[float]] = None,
) -> None:
    col = get_collection()
    emb = embedding or embed_texts([document])[0]
    col.upsert(
        ids=[doc_id],
        documents=[document],
        metadatas=[metadata],
        embeddings=[emb],
    )


def query_knowledge(query: str, n_results: int = RETRIEVE_TOP_K) -> list[dict]:
    col = get_collection()
    if col.count() == 0:
        return []

    query_emb = embed_texts([query])[0]
    results = col.query(
        query_embeddings=[query_emb],
        n_results=min(n_results, col.count()),
        include=["documents", "metadatas", "distances"],
    )

    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    dists = results.get("distances", [[]])[0]

    items = []
    for doc, meta, dist in zip(docs, metas, dists):
        items.append(
            {
                "document": doc,
                "metadata": meta or {},
                "distance": dist,
            }
        )
    return items


def rerank_hits(query: str, hits: list[dict], top_k: int) -> list[dict]:
    if not hits:
        return []
    try:
        reranker = get_reranker()
        pairs = [[query, h["document"]] for h in hits]
        scores = reranker.compute_score(pairs, normalize=True)

        if isinstance(scores, float):
            scores = [scores]

        ranked = sorted(zip(hits, scores), key=lambda x: x[1], reverse=True)
        output = []
        for hit, score in ranked[:top_k]:
            hit = dict(hit)
            hit["rerank_score"] = float(score)
            output.append(hit)
        return output
    except Exception as e:
        print(f"Reranking failed: {e}")
        return hits[:top_k]


def chroma_health() -> dict:
    try:
        col = get_collection()
        return {"ok": True, "documents": col.count(), "path": str(CHROMA_DIR)}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}
