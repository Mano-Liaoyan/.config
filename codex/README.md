# Persistent Codex approval defaults

The preference recorded on **2026-10-04** is **Approve for me**: keep the
workspace permission boundary and route eligible approval requests to automatic
review. The installed Codex backend used for verification was **0.160.0**.

## Apply for this user's setup

1. Read the destination's effective Codex config and any managed requirements.
   These settings are the user's preferred defaults, not overrides of an
   organization's requirements.
2. Back up the existing `~/.codex/config.toml` locally. Merge the three keys from
   [`approval-defaults.toml`](approval-defaults.toml) at the **root of the TOML
   document**, before any table header. Update existing keys rather than
   creating duplicates. Do not replace the whole file or append the snippet
   inside an unrelated `[table]`.
3. Preserve models, providers, plugins, MCP servers, project trust, and desktop
   preferences. If legacy `sandbox_mode` settings or an existing permission
   profile are present, reconcile them using the installed version's
   documentation before applying `default_permissions`. Do not blindly combine
   legacy sandbox settings with permission-profile configuration.
4. Parse the resulting TOML and verify the three values. With Python 3.11+:

   ```sh
   python3 - <<'PY'
   from pathlib import Path
   import tomllib
   path = Path.home() / ".codex" / "config.toml"
   data = tomllib.loads(path.read_text())
   expected = {
       "approval_policy": "on-request",
       "approvals_reviewer": "auto_review",
       "default_permissions": ":workspace",
   }
   for key, value in expected.items():
       assert data.get(key) == value, f"Unexpected value for {key}"
   print("Approval defaults are present and TOML is valid.")
   PY
   ```

5. Verify what a fresh Codex backend actually loads. Its `config/read` API,
   with the intended working directory, resolves configuration layers; inspect
   `configRequirements/read` for restrictions. A project override, launch
   override, or managed requirement can affect the result. Use the API schema
   from the installed version rather than assuming a remembered request shape.
6. After reopening the desktop app, check a new conversation's permission
   control. Existing conversations can retain their previous permission mode.
   Record backend verification and desktop verification separately.

## What was observed and changed

The desktop's stored menu selection was already `guardian-approvals`, but the
user-level config had no explicit approval policy, reviewer, or default
permission profile. A fresh backend's `config/read` returned null for those
defaults. The reported symptom was that the chosen mode reverted after an app
restart.

The three keys in the snippet were added to the existing user config, with a
local backup. A newly started backend then returned `on-request`, `auto_review`,
and `:workspace`, each originating from the user config. Other settings were
preserved, and no approval requirements were returned in that check.

This established persistent backend defaults. It did **not** reproduce or prove
the exact cause of a desktop menu persistence bug. The desktop restart itself
was not part of that verification, so an agent on another machine must still
perform step 6.

Keep full personal config, authentication files, desktop state, and backups out
of this repository. Only the portable snippet belongs here.

References: [official configuration basics](https://learn.chatgpt.com/docs/config-file/config-basic),
[automatic review](https://learn.chatgpt.com/docs/sandboxing/auto-review), and
[permission modes](https://learn.chatgpt.com/docs/permission-modes).
