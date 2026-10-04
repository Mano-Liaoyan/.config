"""Run with python3 test_restore_dictionary.py; only temporary databases are used."""

from contextlib import closing
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
from tempfile import TemporaryDirectory

from restore_dictionary import restore


def check():
    words = Path(__file__).with_name("dictionary.txt").read_text(encoding="utf-8").splitlines()
    assert len(words) == len({word.lower() for word in words}) == 501
    assert {"GitHub", "CI/CD", "C#", "TypeScript", "OpenWhispr"} <= set(words)
    with TemporaryDirectory() as folder:
        path = Path(folder) / "open-whispr" / "transcriptions.db"
        path.parent.mkdir()
        try:
            restore(path, words, apply=True)
            raise AssertionError("Missing database accepted")
        except ValueError:
            assert not path.exists()
        with closing(sqlite3.connect(path)) as db:
            db.executescript("""
                CREATE TABLE custom_dictionary (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, word TEXT NOT NULL UNIQUE,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP, client_dict_id TEXT UNIQUE,
                    cloud_id TEXT, source TEXT NOT NULL DEFAULT 'manual',
                    sync_status TEXT DEFAULT 'pending', deleted_at TEXT, updated_at TEXT);
                CREATE TABLE transcriptions (text TEXT);
                INSERT INTO transcriptions VALUES ('keep unrelated history');
                INSERT INTO custom_dictionary (word, client_dict_id, source, sync_status, cloud_id)
                    VALUES ('github', 'existing-id', 'learned', 'synced', 'cloud-id');
                INSERT INTO custom_dictionary (word, client_dict_id)
                    VALUES ('MyExistingTerm', 'keep-id');
                INSERT INTO custom_dictionary (word, client_dict_id, deleted_at, cloud_id)
                    VALUES ('Git', 'restore-id', '2026-01-01', 'restore-cloud-id');
            """)
            original = db.execute("SELECT * FROM custom_dictionary ORDER BY id").fetchall()
        preview = restore(path, words)
        assert preview["missing"] == 500 and preview["backup"] is None
        cli = subprocess.run([sys.executable, str(Path(__file__).with_name("restore_dictionary.py"))],
                             env={**os.environ, "XDG_CONFIG_HOME": folder}, capture_output=True, text=True, check=True)
        assert json.JSONDecoder().raw_decode(cli.stdout)[0]["database"] == str(path.resolve())
        assert not list(path.parent.glob("*.bak"))
        first = restore(path, words, apply=True)
        assert first["added"] == 499 and first["restored"] == 1 and first["total"] == 502
        with closing(sqlite3.connect(first["backup"])) as backup:
            assert backup.execute("SELECT * FROM custom_dictionary ORDER BY id").fetchall() == original
            assert backup.execute("SELECT text FROM transcriptions").fetchone()[0] == 'keep unrelated history'
        with closing(sqlite3.connect(path)) as db:
            after = db.execute("SELECT * FROM custom_dictionary ORDER BY id").fetchall()
            assert after[:2] == original[:2]
            assert db.execute("SELECT client_dict_id, cloud_id, deleted_at, sync_status FROM custom_dictionary WHERE word='Git'").fetchone() == ('restore-id', 'restore-cloud-id', None, 'pending')
            assert db.execute("SELECT text FROM transcriptions").fetchone()[0] == 'keep unrelated history'
            ids = db.execute("SELECT client_dict_id FROM custom_dictionary").fetchall()
            assert len(ids) == len(set(ids)) and all(value[0] for value in ids)
        second = restore(path, words, apply=True)
        assert second["missing"] == second["added"] == second["restored"] == 0
        assert second["backup"] is None
        with closing(sqlite3.connect(path)) as db:
            assert db.execute("SELECT * FROM custom_dictionary ORDER BY id").fetchall() == after
            # Force failure after a successful first insert, to verify transaction rollback.
            db.execute("""CREATE TRIGGER reject_test BEFORE INSERT ON custom_dictionary
                          WHEN new.word='RejectMe' BEGIN SELECT RAISE(ABORT, 'test rejection'); END""")
        try:
            restore(path, ['TemporaryWord', 'RejectMe'], apply=True)
            raise AssertionError("Constraint failure accepted")
        except sqlite3.IntegrityError:
            with closing(sqlite3.connect(path)) as db:
                assert db.execute("SELECT * FROM custom_dictionary ORDER BY id").fetchall() == after
        wrong = Path(folder) / "wrong.db"
        with closing(sqlite3.connect(wrong)) as db:
            db.execute("CREATE TABLE custom_dictionary (word TEXT)")
        try:
            restore(wrong, words, apply=True)
            raise AssertionError("Unsupported schema accepted")
        except ValueError:
            with closing(sqlite3.connect(wrong)) as db:
                assert db.execute("SELECT count(*) FROM custom_dictionary").fetchone()[0] == 0
    print("OK: preview, merge, backup, preservation, repeat import, rollback, and schema guard")


if __name__ == "__main__":
    check()
