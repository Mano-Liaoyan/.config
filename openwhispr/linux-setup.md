# OpenWhispr automatic paste on KDE Wayland and Ghostty

This is the setup and troubleshooting record verified on **2026-10-04** with
OpenWhispr **1.10.2**, Ghostty **1.2.3-dev+0000000**, and KDE on Wayland.
Use the checks below on another machine; versions, package paths, device-group
IDs, and desktop behavior can differ.

## Apply on another machine

### 1. Check account membership and running-session permissions separately

```sh
getent group input
id -nG "$(id -un)"
id -nG
```

The command with a username queries the account's configured groups. The command
without a username reports the current process's groups. Run these in the real
desktop terminal: an agent sandbox may expose a different group list.

If the installed OpenWhispr setup requires `input` membership, the group exists,
and the account is missing from it, add the current user:

```sh
sudo usermod -aG input "$(id -un)"
```

New group membership does not update already-running applications. Save work
and log out of the desktop, then log back in. If the user manager or another
login session survives logout, a reboot is the reliable way to refresh all
inherited groups. Let the user perform that reboot when ready.

After login, `id -nG` should include `input`. For stronger verification, inspect
the main OpenWhispr process's `Groups:` line in `/proc/<pid>/status` and compare
it with the GID from `getent group input`. Use the destination machine's actual
PID and GID. If the account is already in the group but the process is not,
refresh the session rather than repeating `usermod`.

### 2. Check clipboard transfer before changing shortcuts

Focus Ghostty, dictate a short harmless phrase, and try **Ctrl+Shift+V** manually.
If that pastes the phrase, transcription and transfer to the regular clipboard
work. Continue with the automatic-keystroke checks below. If manual paste also
fails, investigate clipboard transfer first; a keybinding change alone cannot
establish that the text is available.

On the verified machine, `wl-copy`, `ydotool`, and a running `ydotoold` were
available, and OpenWhispr could access `/dev/uinput`. Inspect the installed
package's requirements before installing tools or changing service settings.
The setup screen's **automatic pasting available** status is a capability check,
not an end-to-end test of delivery into Ghostty.

### 3. Merge the Ghostty fallback binding

Back up the existing Ghostty configuration. Merge the setting from
[`../ghostty/openwhispr.conf`](../ghostty/openwhispr.conf) into its effective
configuration, normally `${XDG_CONFIG_HOME:-$HOME/.config}/ghostty/config`:

```ini
keybind = shift+insert=paste_from_clipboard
```

Reconcile an existing binding for the same shortcut instead of adding
contradictory entries. Preserve fonts, themes, shell settings, other bindings,
and included config files.

In the tested Ghostty build, Ctrl+Shift+V used the regular clipboard, while
Shift+Insert defaulted to `paste_from_selection`, which reads the separate
selection clipboard. This setting makes both shortcuts use the regular
clipboard. It changes Shift+Insert's behavior; it does not change Ctrl+V's
terminal behavior. A physical Insert key is unnecessary because OpenWhispr
can generate the shortcut.

Validate the effective configuration:

```sh
ghostty +validate-config
ghostty +list-keybinds
```

Confirm `shift+insert=paste_from_clipboard` and the normal
`ctrl+shift+v=paste_from_clipboard` binding are present. In the tested default
keymap, **Ctrl+Shift+,** reloads configuration. Reload it in the running Ghostty
instance, or restart Ghostty when appropriate.

### 4. Restart OpenWhispr and verify automatic paste

Fully quit OpenWhispr, including its tray process, then reopen it normally.
Changing Ghostty's binding alone was **not sufficient** in the observed session;
automatic paste started working after OpenWhispr was also restarted.

Verify with Ghostty focused:

1. Dictate a harmless phrase and confirm it appears without a manual paste.
2. Quit and reopen OpenWhispr normally, then repeat the test.
3. Report whether both tests passed. A successful helper exit, green setup
   indicator, or configuration syntax check is not a substitute for these tests.

## If automatic paste still fails

Use OpenWhispr's built-in diagnostics for one controlled reproduction. Fully
quit the normal instance first, then run the installed launcher with
`--log-level=debug`. This machine's launcher was:

```sh
/opt/OpenWhispr/open-whispr --log-level=debug
```

The tested build wrote diagnostic files under
`${XDG_CONFIG_HOME:-$HOME/.config}/open-whispr/logs/`. Inspect paste-related
messages such as `Linux paste environment`, `Attempting Linux paste command`,
portal failures, detected window class, and the selected paste method. Avoid
copying raw logs into this repository: they can contain private dictation or
account data. Finish by quitting the diagnostic instance and reopening normally
without the debug flag.

Do not assume the helper's `Paste successful` message proves delivery. Compare
its reported method with what actually appeared in the focused terminal.

## Observed troubleshooting history

| Stage | Evidence and result |
| --- | --- |
| Input-group warning | The account was already a member of `input`, but OpenWhispr, KDE, and their shared systemd user manager lacked that group's GID in their running process credentials. |
| Logout did not resolve it | The user manager had started before the group change and survived the desktop logout. Reopening the desktop inherited its old groups. A later session check confirmed OpenWhispr and KDE had the input GID and `/dev/uinput` belonged to that group. |
| Manual paste worked | The user confirmed Ctrl+Shift+V pasted the dictated text into Ghostty. |
| First workaround was insufficient | The Shift+Insert binding was added and passed Ghostty configuration validation. The user initially still reported failed automatic paste. |
| Diagnostic restart | OpenWhispr was fully restarted with `--log-level=debug`; its bundled paste code was also inspected. |
| Actual paste path | The RemoteDesktop portal timed out. OpenWhispr then invoked `linux-fast-paste --uinput --shift-insert` and reported success. Window detection returned the literal string `(null)`. |
| End-to-end success | After this restart, the user confirmed automatic paste into Ghostty worked. |
| Normal launch verified | OpenWhispr was restarted again without debug logging. The input-group permission was still present, and the user confirmed automatic paste still worked. |

The verified result is the **Ghostty binding plus a fresh OpenWhispr session**.
The binding was not tested in isolation as a sufficient fix, and the evidence
does not identify every cause of the earlier session's failure. The KDE portal
timeout and `(null)` window classification were observed limitations; neither
was independently repaired. No OpenWhispr binaries, packaged source files,
portal tokens, or desktop services were modified.

## References

- [Ghostty keybinding actions](https://ghostty.org/docs/config/keybind/reference)
  describe `paste_from_clipboard` and `paste_from_selection`.
- [OpenWhispr troubleshooting](https://github.com/OpenWhispr/openwhispr/blob/main/TROUBLESHOOTING.md)
  covers Wayland clipboard transfer and the RemoteDesktop portal.
- [OpenWhispr 1.10.2 clipboard implementation](https://github.com/OpenWhispr/openwhispr/blob/v1.10.2/src/helpers/clipboard.js)
  is the version-specific reference for method selection and fallback behavior.
