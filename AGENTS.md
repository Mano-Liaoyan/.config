# Configuration setup for agents

Use English for repository documentation and commit messages.

When setting up or repairing the corresponding applications, read these guides:

- [OpenWhispr on KDE Wayland and Ghostty](openwhispr/linux-setup.md): input-group
  membership, session refresh, automatic paste, and the verified troubleshooting
  history. The Ghostty snippet is in `ghostty/openwhispr.conf`.
- [OpenWhispr dictionary](openwhispr/README.md): restore and verify the portable
  programming dictionary.
- [Codex approval defaults](codex/README.md): merge persistent automatic-review
  defaults into the user's existing Codex configuration.
- [Claude Code status line](claude-code/README.md): installation and verification.

Cloning or pulling this repository does not install its snippets, change Linux
groups, or refresh running applications. For a requested setup, merge only the
relevant settings, preserve other user configuration, and keep backups local.
Finish with the guide's verification steps and report any check still pending.

Do not commit application databases, dictation recordings or transcripts,
credentials, portal permission tokens, debug logs, or full personal Codex config.
