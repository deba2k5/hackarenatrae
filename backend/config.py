import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
CHROMA_DIR = Path(os.getenv("CHROMA_PERSIST_DIR", str(ROOT_DIR / "data" / "chroma")))
DEBERTA_MODEL_DIR = Path(os.getenv("DEBERTA_MODEL_DIR", str(BASE_DIR / "models" / "deberta-terminal")))
SEED_DATA_PATH = BASE_DIR / "training" / "seed_data.json"

MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb+srv://aizenera2025:aizenera2025@traehackathon.wu9n7jq.mongodb.net/?appName=TraeHackathon",
)
MONGODB_DB = os.getenv("MONGODB_DB", "traeguardian")

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
RERANKER_MODEL = os.getenv("RERANKER_MODEL", "BAAI/bge-reranker-base")
DEBERTA_BASE = os.getenv("DEBERTA_BASE", "microsoft/deberta-v3-small")

HF_TOKEN = os.getenv("HF_TOKEN", "")

CHROMA_COLLECTION = "terminal_knowledge"
RERANK_TOP_K = int(os.getenv("RERANK_TOP_K", "3"))
RETRIEVE_TOP_K = int(os.getenv("RETRIEVE_TOP_K", "12"))
