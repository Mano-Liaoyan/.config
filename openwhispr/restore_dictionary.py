#!/usr/bin/env python3
"""Merge the bundled dictionary into an existing OpenWhispr database."""

import argparse
from contextlib import closing
import json
import os
from pathlib import Path
import sqlite3
import tempfile
import uuid


def restore(db_path, words, apply=False):
    db_path = Path(db_path).expanduser().resolve()
    if not db_path.is_file():
        raise ValueError(f"Database not found: {db_path}. Start OpenWhispr once, then quit it.")
    words = list(dict((word.strip().lower(), word.strip()) for word in words if word.strip()).values())
    if not words:
        raise ValueError("The dictionary is empty.")
    mode = "rw" if apply else "ro"
    with closing(sqlite3.connect(db_path.as_uri() + f"?mode={mode}", uri=True, timeout=5)) as db:
        db.row_factory = sqlite3.Row
        columns = {row[1] for row in db.execute("PRAGMA table_info(custom_dictionary)")}
        required = {"id", "word", "created_at", "client_dict_id", "cloud_id", "source", "sync_status", "deleted_at", "updated_at"}
        if not required <= columns:
            raise ValueError("Unsupported custom_dictionary schema; inspect this OpenWhispr version before importing.")
        db.execute("BEGIN IMMEDIATE" if apply else "BEGIN")
        try:
            before = [dict(row) for row in db.execute("SELECT * FROM custom_dictionary ORDER BY id")]
            active = {row["word"].lower(): row for row in before if row["deleted_at"] is None}
            deleted = {row["word"].lower(): row for row in before if row["deleted_at"] is not None}
            missing = [word for word in words if word.lower() not in active]
            result = {"database": str(db_path), "requested": len(words), "existing": len(active),
                      "missing": len(missing), "added": 0, "restored": 0, "backup": None}
            if not apply or not missing:
                db.rollback()
                return result

            # A second reader snapshots the database while our write lock blocks other writers.
            fd, name = tempfile.mkstemp(prefix=db_path.name + ".before-dictionary-", suffix=".bak", dir=db_path.parent)
            os.close(fd)
            result["backup"] = name
            with closing(sqlite3.connect(db_path.as_uri() + "?mode=ro", uri=True)) as reader:
                with closing(sqlite3.connect(name)) as backup:
                    reader.backup(backup)

            for word in missing:
                previous = deleted.get(word.lower())
                if previous:
                    db.execute("""UPDATE custom_dictionary SET word=?, deleted_at=NULL, source='manual',
                               sync_status='pending', updated_at=datetime('now') WHERE id=?""", (word, previous["id"]))
                    result["restored"] += 1
                else:
                    db.execute("""INSERT INTO custom_dictionary
                               (word, source, client_dict_id, sync_status, updated_at)
                               VALUES (?, 'manual', ?, 'pending', datetime('now'))""", (word, str(uuid.uuid4())))
                    result["added"] += 1

            after = {row["id"]: dict(row) for row in db.execute("SELECT * FROM custom_dictionary")}
            if any(after.get(row["id"]) != row for row in active.values()):
                raise ValueError("An existing active entry changed; rolling back.")
            present = {row["word"].lower() for row in after.values() if row["deleted_at"] is None}
            if any(word.lower() not in present for word in words):
                raise ValueError("Dictionary verification failed; rolling back.")
            if [row[0] for row in db.execute("PRAGMA quick_check")] != ["ok"]:
                raise ValueError("Database integrity check failed; rolling back.")
            db.commit()
            result["missing"] = 0
            result["total"] = len(present)
            return result
        except Exception:
            db.rollback()
            raise


def main():
    config_home = Path(os.environ.get("XDG_CONFIG_HOME") or Path.home() / ".config")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", type=Path, default=config_home / "open-whispr" / "transcriptions.db",
                        help="existing database path (default: $XDG_CONFIG_HOME/open-whispr/transcriptions.db)")
    parser.add_argument("--apply", action="store_true", help="write changes; fully quit OpenWhispr first")
    args = parser.parse_args()
    try:
        words = Path(__file__).with_name("dictionary.txt").read_text(encoding="utf-8-sig").splitlines()
        result = restore(args.db, words, apply=args.apply)
    except (OSError, ValueError, sqlite3.Error) as error:
        parser.exit(1, f"Error: {error}\n")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if not args.apply:
        print("Preview only. Fully quit OpenWhispr, then rerun with --apply.")
    else:
        print("Verified. Reopen OpenWhispr to refresh its dictionary cache.")


if __name__ == "__main__":
    main()
