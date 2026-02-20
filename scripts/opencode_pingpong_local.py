#!/usr/bin/env python3
"""Simple ping-pong chat client for a local OpenCode server.

Usage:
  1) Start server (local only):
       OPENCODE_SERVER_PASSWORD=yourpass opencode serve --hostname 127.0.0.1 --port 9876

  2) Run this script:
       python3 scripts/opencode_pingpong_local.py --pass yourpass --port 9876

Then type messages; it will reuse the same OpenCode session (true ping-pong).
"""

from __future__ import annotations

import argparse
import base64
import json
import sys
import urllib.request
import urllib.error


def _basic_auth_header(username: str, password: str) -> str:
    token = base64.b64encode(f"{username}:{password}".encode("utf-8")).decode("ascii")
    return f"Basic {token}"


def _http_json(method: str, url: str, auth_header: str, body: dict | None = None, timeout: int = 120) -> dict:
    data = None
    headers = {
        "Authorization": auth_header,
        "Accept": "application/json",
    }
    if body is not None:
        raw = json.dumps(body).encode("utf-8")
        data = raw
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, method=method, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            txt = resp.read().decode("utf-8")
            return json.loads(txt) if txt else {}
    except urllib.error.HTTPError as e:
        err_txt = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {e.code} {e.reason}: {err_txt}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=9876)
    ap.add_argument("--user", default="opencode")
    ap.add_argument("--pass", dest="password", required=True)
    ap.add_argument("--title", default="local-pingpong")
    ap.add_argument(
        "--directory",
        help="Project directory to bind this session to (OpenCode server 'directory' query param). If omitted, you'll be prompted.",
        default=None,
    )
    args = ap.parse_args()

    base = f"http://{args.host}:{args.port}"
    auth = _basic_auth_header(args.user, args.password)

    health = _http_json("GET", f"{base}/global/health", auth)
    print(f"[health] {health}")

    # Choose project directory interactively if not provided.
    directory = args.directory
    if not directory:
        import os
        from pathlib import Path

        candidates = [
            str(Path.cwd()),
            str(Path.home() / "Desktop/git/kr-stock-daily-brief"),
            str(Path.home() / ".openclaw/workspace"),
        ]
        # Keep only existing dirs and de-dup while preserving order
        seen = set()
        existing = []
        for c in candidates:
            if c not in seen and os.path.isdir(c):
                seen.add(c)
                existing.append(c)

        print("\nSelect project directory:")
        for i, c in enumerate(existing, start=1):
            print(f"  {i}) {c}")
        print("  0) Enter a custom path")
        print("  (If not in list, you can paste a path directly)")

        while True:
            choice = input("directory> ").strip()
            if choice == "0" or choice.lower() in {"custom", "c"}:
                directory = input("custom path> ").strip()
            elif choice.isdigit() and 1 <= int(choice) <= len(existing):
                directory = existing[int(choice) - 1]
            else:
                # allow direct path paste
                directory = choice

            if directory and os.path.isdir(directory):
                break
            print("Invalid directory. Please try again.")

    # Encode directory query param
    from urllib.parse import quote

    dir_q = quote(directory)

    # Ask whether to create a NEW session or CONTINUE an existing one.
    sessions = _http_json("GET", f"{base}/session?directory={dir_q}&limit=10", auth)
    sessions = sessions if isinstance(sessions, list) else []

    print("\nSession mode:")
    print("  n) New session")
    if sessions:
        print("  c) Continue an existing session")
    else:
        print("  (No existing sessions found for this directory)")

    mode = "n"
    while True:
        mode = input("mode [n/c]> ").strip().lower() or "n"
        if mode in {"n", "new"}:
            mode = "n"
            break
        if mode in {"c", "continue"} and sessions:
            mode = "c"
            break
        print("Invalid choice. Enter 'n' (new) or 'c' (continue).")

    if mode == "c":
        print("\nSelect a session to continue:")
        for i, s in enumerate(sessions, start=1):
            title = s.get("title") or "(untitled)"
            sid = s.get("id")
            updated = s.get("time", {}).get("updated")
            print(f"  {i}) {title}  [{sid}]  updated={updated}")
        print("  0) Back (create new session)")

        session_id = None
        while True:
            pick = input("session> ").strip()
            if pick == "0":
                break
            if pick.isdigit() and 1 <= int(pick) <= len(sessions):
                session_id = sessions[int(pick) - 1]["id"]
                break
            # allow direct paste of ses_...
            if pick.startswith("ses_"):
                session_id = pick
                break
            print("Invalid selection. Try again.")

        if session_id:
            ses = _http_json("GET", f"{base}/session/{session_id}?directory={dir_q}", auth)
        else:
            ses = _http_json("POST", f"{base}/session?directory={dir_q}", auth, {"title": args.title})
            session_id = ses["id"]
    else:
        ses = _http_json("POST", f"{base}/session?directory={dir_q}", auth, {"title": args.title})
        session_id = ses["id"]

    print(f"[session] id={session_id} slug={ses.get('slug')} directory={directory}")

    def exit_flow() -> int:
        print("\nExit options:")
        print("  k) Keep session (default)")
        print("  d) Delete session")
        ans = input("exit [k/d]> ").strip().lower() or "k"
        if ans in {"d", "delete"}:
            ok = _http_json("DELETE", f"{base}/session/{session_id}?directory={dir_q}", auth)
            print(f"[deleted] {ok}")
        print("bye")
        return 0

    print("\nType message and press Enter.")
    print("Commands: /new (new session), /exit (exit + ask delete/keep)\n")

    while True:
        try:
            raw = input("you> ")
        except EOFError:
            return exit_flow()
        except KeyboardInterrupt:
            # Graceful exit instead of immediate kill
            return exit_flow()

        msg = raw.strip()
        if not msg:
            continue

        if msg in {"/exit", "/quit"}:
            return exit_flow()

        if msg == "/new":
            ses = _http_json("POST", f"{base}/session?directory={dir_q}", auth, {"title": args.title})
            session_id = ses["id"]
            print(f"[session] id={session_id} slug={ses.get('slug')} directory={directory}")
            continue

        if not msg:
            continue

        resp = _http_json(
            "POST",
            f"{base}/session/{session_id}/message?directory={dir_q}",
            auth,
            {"parts": [{"type": "text", "text": msg}]},
            timeout=300,
        )

        # Join all text parts for display
        parts = resp.get("parts", [])
        texts = [p.get("text", "") for p in parts if p.get("type") == "text"]
        out = "\n".join(t for t in texts if t)
        if out:
            print(f"opencode> {out}\n")
        else:
            # fallback: print raw response (truncated)
            raw = json.dumps(resp, ensure_ascii=False)[:2000]
            print(f"opencode> (non-text response) {raw}\n")


if __name__ == "__main__":
    raise SystemExit(main())
