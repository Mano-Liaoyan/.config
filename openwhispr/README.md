# OpenWhispr

For Linux installation or paste failures, follow
[the KDE Wayland and Ghostty setup guide](linux-setup.md). It includes the
verified input-group and automatic-paste troubleshooting history, the portable
Ghostty setting, and the checks agents must repeat on another machine.

## Programming dictionary

The dictionary imported on Windows on 2026-10-03: **500 programming terms plus
the existing `OpenWhispr` entry (501 unique entries)**. `dictionary.txt` is the
portable source of truth, one entry per line, including `GitHub`, `CI/CD`, `C#`,
JavaScript, TypeScript, .NET, databases, DevOps, cloud, security and AI terms.

## Restore on Linux (for agents)

Requires Python 3.8+ with its standard `sqlite3` module and an installed
OpenWhispr. No pip packages or GUI automation are needed.

1. Open OpenWhispr once so it initializes its database, then fully quit it,
   including the tray process. Keep it closed during the import.
2. From this repository's root, preview the import:

   ```sh
   python3 openwhispr/restore_dictionary.py
   ```

   The default database is
   `${XDG_CONFIG_HOME:-$HOME/.config}/open-whispr/transcriptions.db`.
   If this installation uses another location (for example a sandboxed package
   or a custom profile), locate its existing database and pass
   `--db /absolute/path/to/transcriptions.db` to every command below.
   A missing database or unsupported schema causes an error without creating
   or migrating a database. Check the installed version and actual schema
   before proceeding in that case.
3. Confirm the preview targets the intended profile and shows `requested: 501`,
   then import:

   ```sh
   python3 openwhispr/restore_dictionary.py --apply
   python3 openwhispr/restore_dictionary.py
   ```

   Completion requires the apply command to succeed and the second preview to
   show `missing: 0`. Existing entries are preserved, so the total may exceed 501.
4. Reopen OpenWhispr to reload its dictionary cache. Verify the Dictionary view
   includes `GitHub`, `CI/CD`, `C#`, JavaScript and TypeScript. Report the added
   and restored counts and the backup location.

## Import and backup behavior

- Imports are case-insensitive and additive. Repeating the command does not
  create duplicates or change active entries' spelling, timestamps or sync IDs.
- A matching deleted entry is restored. New entries receive fresh UUIDs and
  the app's normal `manual` / `pending` synchronization fields.
- Before any changes, SQLite creates a consistent local database backup next
  to the original: `transcriptions.db.before-dictionary-*.bak`. It includes the
  database's other data, including transcription history; keep this backup local.
- Changes use one transaction and are verified before commit. On failure they
  roll back. The script writes only the `custom_dictionary` table.
- A full database backup restores all database data to that point in time.
  For a later dictionary-only rollback, use the backup as the source for a
  targeted restore so that newer transcription history is preserved.

The schema and startup cache behavior were checked against the installed
OpenWhispr **1.10.2**. The importer checks the required schema on the destination;
it does not assume every version is compatible. The Linux default follows
[Electron's `userData` path convention](https://www.electronjs.org/docs/latest/api/app#appgetpathname).
Some Whisper models limit dictionary prompt length, so storing all entries
does not guarantee that every entry is considered on every transcription.

## Check the script

```sh
python3 openwhispr/test_restore_dictionary.py
```

This uses temporary databases to check preview, merge, backup, existing data
preservation, repeat imports, rollback and rejection of unsupported schemas.
