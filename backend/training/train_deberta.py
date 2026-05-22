"""
Fine-tune DeBERTa-v3 on terminal error classification (local, no API keys).
Usage: cd backend && python -m training.train_deberta
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    Trainer,
    TrainingArguments,
)

from config import DEBERTA_BASE, DEBERTA_MODEL_DIR, SEED_DATA_PATH


def load_dataset():
    rows = json.loads(SEED_DATA_PATH.read_text(encoding="utf-8"))
    texts = [r["error_log"] for r in rows]
    labels = [r["error_type"] for r in rows]
    label_names = sorted(set(labels))
    label2id = {name: i for i, name in enumerate(label_names)}
    id2label = {i: name for name, i in label2id.items()}
    y = [label2id[l] for l in labels]
    return texts, y, label2id, id2label


class ErrorDataset(torch.utils.data.Dataset):
    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels = labels

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        item = {k: torch.tensor(v[idx]) for k, v in self.encodings.items()}
        item["labels"] = torch.tensor(self.labels[idx])
        return item


def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    return {
        "accuracy": accuracy_score(labels, preds),
        "f1_macro": f1_score(labels, preds, average="macro", zero_division=0),
    }


def train():
    from hf_auth import configure_hf

    configure_hf()
    texts, labels, label2id, id2label = load_dataset()
    train_texts, val_texts, train_labels, val_labels = train_test_split(
        texts, labels, test_size=0.2, random_state=42
    )

    tokenizer = AutoTokenizer.from_pretrained(DEBERTA_BASE)
    model = AutoModelForSequenceClassification.from_pretrained(
        DEBERTA_BASE,
        num_labels=len(label2id),
        id2label=id2label,
        label2id=label2id,
    )

    train_enc = tokenizer(train_texts, truncation=True, padding=True, max_length=512)
    val_enc = tokenizer(val_texts, truncation=True, padding=True, max_length=512)

    train_ds = ErrorDataset(train_enc, train_labels)
    val_ds = ErrorDataset(val_enc, val_labels)

    DEBERTA_MODEL_DIR.mkdir(parents=True, exist_ok=True)
    args = TrainingArguments(
        output_dir=str(DEBERTA_MODEL_DIR / "checkpoints"),
        num_train_epochs=6,
        per_device_train_batch_size=4,
        per_device_eval_batch_size=4,
        warmup_ratio=0.1,
        weight_decay=0.01,
        logging_steps=5,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="f1_macro",
        report_to="none",
    )

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=train_ds,
        eval_dataset=val_ds,
        compute_metrics=compute_metrics,
    )

    trainer.train()
    trainer.save_model(str(DEBERTA_MODEL_DIR))
    tokenizer.save_pretrained(str(DEBERTA_MODEL_DIR))

    (DEBERTA_MODEL_DIR / "labels.json").write_text(
        json.dumps({"label2id": label2id, "id2label": {str(k): v for k, v in id2label.items()}}, indent=2),
        encoding="utf-8",
    )
    print(f"DeBERTa model saved to {DEBERTA_MODEL_DIR}")


if __name__ == "__main__":
    train()
