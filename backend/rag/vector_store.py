import os
from langchain_chroma import Chroma
from langchain_core.documents import Document
import chromadb
from agents.llm_provider import get_embeddings

# Use local persistent ChromaDB inside the workspace
CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "vector_store")

def get_vector_store(collection_name: str = "project_codebase"):
    """
    Initializes and returns a connection to the local ChromaDB vector store.
    Uses OpenAI embeddings (text-embedding-3-small) as requested.
    """
    persistent_client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
    
    embeddings = get_embeddings()
    
    vector_store = Chroma(
        client=persistent_client,
        collection_name=collection_name,
        embedding_function=embeddings
    )
    
    return vector_store

def index_code_file(file_path: str, content: str):
    """
    Indexes a code file into ChromaDB for semantic search.
    For a production app, we would chunk this with Tree-sitter AST parsing.
    """
    vector_store = get_vector_store()
    
    # Create document with metadata
    doc = Document(
        page_content=content,
        metadata={"source": file_path, "type": "code"}
    )
    
    vector_store.add_documents([doc])
    print(f"Indexed {file_path} into vector store.")

def semantic_search(query: str, top_k: int = 3):
    """
    Retrieves the most semantically relevant code snippets.
    """
    vector_store = get_vector_store()
    
    results = vector_store.similarity_search(query, k=top_k)
    return results
