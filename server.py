import http.server
import socketserver
import json
import os
import socket
import sys
import urllib.parse
import urllib.request
import urllib.error
import hashlib
import difflib
import datetime
import glob
import fnmatch
import zipfile
import subprocess

DEFAULT_PORT = 8000
CANONICAL_PATH = "content/selfware_demo.md"
CURRENT_PORT = None
SUPPORTED_LANGS = ("zh", "en")

def normalize_lang(lang: str):
    if not lang:
        return None
    v = str(lang).strip().lower()
    if v == "zh" or v.startswith("zh-"):
        return "zh"
    if v == "en" or v.startswith("en-"):
        return "en"
    return None

def canonical_path_for_lang(lang: str):
    l = normalize_lang(lang)
    if l == "en":
        return "content/selfware_demo.en.md"
    # default / zh
    return CANONICAL_PATH

def protocol_path_for_lang(lang: str):
    l = normalize_lang(lang)
    if l == "en":
        return "selfware.en.md"
    return "selfware.md"

def parse_cookie_lang(cookie_header: str):
    if not cookie_header:
        return None
    try:
        parts = [p.strip() for p in str(cookie_header).split(";") if p.strip()]
        for p in parts:
            if "=" not in p:
                continue
            k, v = p.split("=", 1)
            if k.strip().lower() == "selfware_lang":
                return normalize_lang(urllib.parse.unquote(v.strip()))
    except Exception:
        return None
    return None

def parse_accept_language(header_value: str):
    if not header_value:
        return None
    # Example: "en-US,en;q=0.9,zh-CN;q=0.8"
    best = None
    best_q = -1.0
    for raw in str(header_value).split(","):
        item = raw.strip()
        if not item:
            continue
        lang_range = item
        q = 1.0
        if ";" in item:
            lang_range, params = item.split(";", 1)
            lang_range = lang_range.strip()
            params = params.strip()
            for p in params.split(";"):
                p = p.strip()
                if p.startswith("q="):
                    try:
                        q = float(p[2:].strip())
                    except Exception:
                        q = 1.0
        nl = normalize_lang(lang_range)
        if not nl:
            continue
        if q > best_q:
            best_q = q
            best = nl
    return best

def pick_request_lang(handler, qs):
    explicit = normalize_lang((qs.get("lang") or [None])[0])
    if explicit:
        return explicit, "query"
    cookie_lang = parse_cookie_lang(handler.headers.get("Cookie"))
    if cookie_lang:
        return cookie_lang, "cookie"
    al = parse_accept_language(handler.headers.get("Accept-Language"))
    if al:
        return al, "accept_language"
    return None, "default"

def set_lang_cookie(handler, lang: str):
    l = normalize_lang(lang)
    if not l:
        return
    handler.send_header("Set-Cookie", f"selfware_lang={urllib.parse.quote(l)}; Path=/; SameSite=Lax")

def find_free_port(start_port: int, host: str = "127.0.0.1", max_tries: int = 200) -> int:
    for port in range(start_port, start_port + max_tries):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.bind((host, port))
            except OSError:
                continue
            return port
    raise RuntimeError(f"No free port found in range {start_port}..{start_port + max_tries - 1}")

def normalize_text_for_hash(s: str) -> str:
    normalized = (s or "").replace("\r\n", "\n").replace("\r", "\n")
    if not normalized.endswith("\n"):
        normalized += "\n"
    return normalized

def sha256_text(s: str) -> str:
    return hashlib.sha256(normalize_text_for_hash(s).encode("utf-8")).hexdigest()

def git_info():
    try:
        subprocess.run(
            ["git", "rev-parse", "--is-inside-work-tree"],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except Exception:
        return {"is_repo": False}

    def safe(cmd):
        try:
            return subprocess.check_output(cmd, stderr=subprocess.DEVNULL, text=True).strip()
        except Exception:
            return ""

    remotes_raw = safe(["git", "remote"])
    remotes = [r for r in remotes_raw.splitlines() if r.strip()] if remotes_raw else []
    info = {
        "is_repo": True,
        "head": safe(["git", "rev-parse", "HEAD"]),
        "branch": safe(["git", "branch", "--show-current"]),
        "remotes": remotes,
    }
    if remotes:
        info["remote_urls"] = {r: safe(["git", "remote", "get-url", r]) for r in remotes}
    return info

def capabilities_payload(base_url: str = ""):
    payload = {
        "protocol": {"path": "selfware.md", "translations": [{"lang": "en", "path": "selfware.en.md"}]},
        "canonical": {
            "path": CANONICAL_PATH,
            "variants": [{"lang": "zh", "path": CANONICAL_PATH}, {"lang": "en", "path": "content/selfware_demo.en.md"}],
        },
        "languages": {"supported": list(SUPPORTED_LANGS)},
        "write_scope": ["content/"],
        "confirmation_required": ["pack", "publish", "send_context", "pull_merge", "apply_updates"],
        "agent_interaction": {
            "proactive_prompting": True,
            "no_silent_apply": True,
            "note": "When a capability is supported but not enabled / missing config / has strategy branches, the agent should ask the user before any write or outbound request.",
        },
        "endpoints": {
            "content_get": "/api/content",
            "content_save": "/api/save",
            "self_get": "/api/self",
            "protocol_get": "/api/protocol",
            "manifest_get": "/api/manifest",
            "capabilities_get": "/api/capabilities",
            "check_update": "/api/check_update?url=...",
            "proxy": "/api/proxy?url=...",
        },
        "modules": {
            "pack_self": {"supported": True},
            "local_git": git_info(),
            "discovery": {"supported": True, "enabled": False, "endpoint_example": "https://floatboat.ai/discovery/"},
            "ecosystem": {"supported": True, "artifact_sha256_required": True},
            "self_analysis": {"supported": True, "implemented": False},
        },
    }
    if base_url:
        payload["base_url"] = base_url
    return payload

def read_text_file(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def strip_md_code(s: str) -> str:
    s = (s or "").strip()
    if s.startswith("`") and s.endswith("`") and len(s) >= 2:
        return s[1:-1].strip()
    return s

def parse_bullets_under_heading(lines, heading_prefix: str):
    items = []
    in_section = False
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("### "):
            in_section = stripped.startswith(heading_prefix)
            continue
        if not in_section:
            continue
        # Stop when leaving this subsection (any heading level)
        if stripped.startswith("#"):
            break
        if stripped.startswith("- "):
            val = strip_md_code(stripped[2:].strip())
            if val:
                items.append(val)
    return items

def load_pack_plan_from_manifest(manifest_path: str = "manifest.md"):
    text = read_text_file(manifest_path)
    lines = text.splitlines()
    required = parse_bullets_under_heading(lines, "### 4.1 Required")
    include = parse_bullets_under_heading(lines, "### 4.2 Include")
    exclude = parse_bullets_under_heading(lines, "### 4.3 Exclude")
    return {"required": required, "include": include, "exclude": exclude}

def expand_patterns(patterns):
    paths = []
    for pat in patterns:
        pat = (pat or "").strip()
        if not pat:
            continue
        matches = glob.glob(pat, recursive=True)
        for m in matches:
            if os.path.isfile(m):
                paths.append(m)
    return paths

def build_pack_file_list(plan):
    required = plan.get("required") or []
    include = plan.get("include") or []
    exclude = plan.get("exclude") or []

    included_files = set(expand_patterns(required + include))
    excluded_files = set(expand_patterns(exclude))
    final_files = sorted([p for p in included_files if p not in excluded_files])

    missing_required = []
    for req in required:
        if os.path.isfile(req):
            continue
        if not glob.glob(req, recursive=True):
            missing_required.append(req)
    return final_files, missing_required

def human_size(n: int) -> str:
    unit = ["B", "KB", "MB", "GB", "TB"]
    f = float(n)
    for u in unit:
        if f < 1024 or u == unit[-1]:
            return f"{f:.1f}{u}" if u != "B" else f"{int(f)}B"
        f /= 1024
    return f"{int(n)}B"

def make_container_manifest() -> str:
    return "\n".join([
        "Selfware-Container: zip",
        "Selfware-Container-Version: 1",
        "Protocol-Source: https://floatboat.ai/selfware.md",
        "Local-Protocol-Path: selfware.md",
        "Canonical-Data-Scope: content/",
        f"Canonical-Data-Path: {CANONICAL_PATH}",
        "",
    ])

def pack_self(out_path: str, yes: bool = False) -> int:
    plan = load_pack_plan_from_manifest("manifest.md")
    files, missing_required = build_pack_file_list(plan)
    if missing_required:
        print("Error: missing required pack items:")
        for m in missing_required:
            print(f"  - {m}")
        return 2
    if not files:
        print("Error: pack plan produced an empty file list.")
        return 2

    sizes = [(p, os.path.getsize(p)) for p in files]
    total = sum(sz for _, sz in sizes)

    print("Pack plan summary:")
    print(f"  Output: {out_path}")
    print(f"  Files: {len(files)}  Total: {human_size(total)}")
    print("  Exclude patterns:")
    for pat in (plan.get("exclude") or []):
        print(f"    - {pat}")
    print("  Included files:")
    for p, sz in sizes:
        print(f"    - {p} ({human_size(sz)})")

    if not yes:
        try:
            ans = input("Proceed to write .self container? [y/N] ").strip().lower()
        except EOFError:
            print("Canceled (no interactive input; use --yes to confirm).")
            return 1
        if ans not in ("y", "yes"):
            print("Canceled.")
            return 1

    os.makedirs(os.path.dirname(os.path.abspath(out_path)) or ".", exist_ok=True)
    tmp_out = out_path + ".tmp"
    if os.path.exists(tmp_out):
        os.remove(tmp_out)
    with zipfile.ZipFile(tmp_out, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("self/manifest.md", make_container_manifest())
        for p in files:
            arc = os.path.relpath(p, ".").replace(os.sep, "/")
            zf.write(p, arcname=arc)
    os.replace(tmp_out, out_path)
    print(f"Wrote: {out_path}")
    return 0

def parse_cli(argv):
    if not argv:
        return ("serve", {"port": None})
    if argv[0] == "pack":
        out = None
        yes = False
        for a in argv[1:]:
            if a in ("--yes", "-y"):
                yes = True
            elif out is None:
                out = a
        if not out:
            return ("help", {"error": "Missing output path for pack"})
        return ("pack", {"out": out, "yes": yes})
    if argv[0].isdigit():
        return ("serve", {"port": int(argv[0])})
    return ("help", {"error": f"Unknown command/arg: {argv[0]}"})

def get_port(port_override=None) -> int:
    # Priority: CLI port override > env var > default
    if port_override is not None:
        return int(port_override)
    env_port = os.environ.get("SELFWARE_PORT") or os.environ.get("AUDP_PORT") or os.environ.get("PORT")
    if env_port:
        return int(env_port)
    # If default is occupied (very common), pick the next free port.
    return find_free_port(DEFAULT_PORT)

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(parsed.query)
        lang, lang_source = pick_request_lang(self, qs)
        lang_is_explicit = (lang_source == "query")

        # If language wasn't explicitly chosen, and the environment prefers English,
        # redirect HTML entry points to include ?lang=en for consistent navigation.
        if not lang_is_explicit and lang == "en" and (parsed.path == "/" or parsed.path.startswith("/views/")):
            if parsed.path == "/" or parsed.path.endswith(".html"):
                new_qs = dict(qs)
                new_qs["lang"] = ["en"]
                new_query = urllib.parse.urlencode(new_qs, doseq=True)
                loc = parsed.path + ("?" + new_query if new_query else "")
                self.send_response(302)
                set_lang_cookie(self, "en")
                self.send_header("Location", loc)
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                return
        if parsed.path == '/':
            self.send_response(302)
            loc = '/views/self.html'
            if lang and (lang_source in ("query", "cookie")):
                loc = f"{loc}?lang={urllib.parse.quote(lang)}"
            if lang and (lang_source in ("query", "accept_language")):
                set_lang_cookie(self, lang)
            self.send_header('Location', loc)
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            return
        if parsed.path == '/api/self':
            try:
                cpath = canonical_path_for_lang(lang)
                with open(cpath, 'r', encoding='utf-8') as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Cache-Control', 'no-store')
                if lang_is_explicit and lang:
                    set_lang_cookie(self, lang)
                self.end_headers()
                self.wfile.write(json.dumps({
                    'lang': lang or "zh",
                    'path': cpath,
                    'sha256': sha256_text(content),
                    'content': content,
                }).encode('utf-8'))
            except FileNotFoundError:
                self.send_error(404, f"{canonical_path_for_lang(lang)} not found")
            except Exception as e:
                self.send_error(500, str(e))
        elif parsed.path == '/api/protocol':
            try:
                ppath = protocol_path_for_lang(lang)
                with open(ppath, 'r', encoding='utf-8') as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Cache-Control', 'no-store')
                if lang_is_explicit and lang:
                    set_lang_cookie(self, lang)
                self.end_headers()
                self.wfile.write(json.dumps({
                    'lang': lang or "zh",
                    'path': ppath,
                    'sha256': sha256_text(content),
                    'content': content,
                }).encode('utf-8'))
            except FileNotFoundError:
                self.send_error(404, f"{protocol_path_for_lang(lang)} not found")
            except Exception as e:
                self.send_error(500, str(e))
        elif parsed.path == '/api/manifest':
            try:
                with open('manifest.md', 'r', encoding='utf-8') as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Cache-Control', 'no-store')
                self.end_headers()
                self.wfile.write(json.dumps({'content': content}).encode('utf-8'))
            except FileNotFoundError:
                self.send_error(404, "manifest.md not found")
            except Exception as e:
                self.send_error(500, str(e))
        elif parsed.path == '/api/content':
            try:
                cpath = canonical_path_for_lang(lang)
                with open(cpath, 'r', encoding='utf-8') as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Cache-Control', 'no-store')
                if lang_is_explicit and lang:
                    set_lang_cookie(self, lang)
                self.end_headers()
                self.wfile.write(json.dumps({'lang': lang or "zh", 'path': cpath, 'content': content}).encode('utf-8'))
            except FileNotFoundError:
                self.send_error(404, f"{canonical_path_for_lang(lang)} not found")
            except Exception as e:
                self.send_error(500, str(e))
        elif parsed.path == '/api/capabilities':
            port = CURRENT_PORT
            base_url = f"http://127.0.0.1:{port}" if port else ""
            payload = capabilities_payload(base_url=base_url)
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(json.dumps(payload).encode('utf-8'))
        elif parsed.path == '/api/check_update':
            url = (qs.get('url') or [None])[0] or "https://floatboat.ai/selfware.md"
            if not (url.startswith("http://") or url.startswith("https://")):
                self.send_error(400, "Only http(s) urls are allowed")
                return
            try:
                cpath = canonical_path_for_lang(lang)
                with open(cpath, 'r', encoding='utf-8') as f:
                    local_content = f.read()
            except FileNotFoundError:
                self.send_error(404, f"{canonical_path_for_lang(lang)} not found")
                return

            try:
                req = urllib.request.Request(
                    url,
                    headers={
                        "User-Agent": "Selfware-Local-UpdateCheck/0.1",
                        "Accept": "text/markdown,*/*",
                    },
                )
                try:
                    with urllib.request.urlopen(req, timeout=15) as resp:
                        remote_bytes = resp.read()
                        remote_text = remote_bytes.decode("utf-8", errors="replace")
                        remote_etag = resp.headers.get("ETag")
                        remote_last_modified = resp.headers.get("Last-Modified")
                        remote_status = getattr(resp, "status", 200)
                except urllib.error.HTTPError as e:
                    remote_status = getattr(e, "code", None)
                    remote_etag = e.headers.get("ETag") if getattr(e, "headers", None) else None
                    remote_last_modified = e.headers.get("Last-Modified") if getattr(e, "headers", None) else None
                    payload = {
                        "source_url": url,
                        "checked_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
                        "local": {"path": CANONICAL_PATH, "sha256": sha256_text(local_content)},
                        "remote": {"status": remote_status, "etag": remote_etag, "last_modified": remote_last_modified},
                        "has_update": None,
                        "diff_preview": "",
                        "error": f"HTTP Error {remote_status}: {getattr(e, 'reason', '')}".strip(),
                    }
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Cache-Control', 'no-store')
                    self.end_headers()
                    self.wfile.write(json.dumps(payload).encode('utf-8'))
                    return

                local_sha = sha256_text(local_content)
                remote_sha = sha256_text(remote_text)
                has_update = local_sha != remote_sha

                diff_lines = list(difflib.unified_diff(
                    normalize_text_for_hash(local_content).splitlines(keepends=False),
                    normalize_text_for_hash(remote_text).splitlines(keepends=False),
                    fromfile=CANONICAL_PATH,
                    tofile=url,
                    lineterm="",
                ))
                diff_preview = "\n".join(diff_lines[:200])

                payload = {
                    "source_url": url,
                    "checked_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
                    "local": {"path": CANONICAL_PATH, "sha256": local_sha},
                    "remote": {"status": remote_status, "sha256": remote_sha, "etag": remote_etag, "last_modified": remote_last_modified},
                    "has_update": has_update,
                    "diff_preview": diff_preview,
                    "note": "Applying updates MUST require explicit user confirmation and disclosure of update logic + summary (see selfware.md).",
                }
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Cache-Control', 'no-store')
                self.end_headers()
                self.wfile.write(json.dumps(payload).encode('utf-8'))
            except Exception as e:
                self.send_error(502, f"Update check failed: {e}")
        elif parsed.path == '/api/proxy':
            # Proxy remote assets (mainly images) so front-end exports don't fail on CORS.
            qs = urllib.parse.parse_qs(parsed.query)
            url = (qs.get('url') or [None])[0]
            if not url:
                self.send_error(400, "Missing url")
                return
            if not (url.startswith("http://") or url.startswith("https://")):
                self.send_error(400, "Only http(s) urls are allowed")
                return
            try:
                req = urllib.request.Request(
                    url,
                    headers={
                        "User-Agent": "AUDP-Local-Proxy/1.0",
                        "Accept": "*/*",
                    },
                )
                with urllib.request.urlopen(req, timeout=15) as resp:
                    data = resp.read()
                    ctype = resp.headers.get("Content-Type") or "application/octet-stream"
                self.send_response(200)
                self.send_header("Content-Type", ctype)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Cache-Control", "public, max-age=86400")
                self.end_headers()
                self.wfile.write(data)
            except Exception as e:
                self.send_error(502, f"Proxy fetch failed: {e}")
        else:
            # Serve static files (HTML, CSS, JS)
            super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(parsed.query)
        lang_q = normalize_lang((qs.get('lang') or [None])[0])

        if parsed.path == '/api/save':
            try:
                content_len = int(self.headers.get('Content-Length'))
                post_body = self.rfile.read(content_len)
                data = json.loads(post_body.decode('utf-8'))
                
                # Write back to canonical single-file source (content/selfware_demo.md)...
                content = data.get('content')
                lang = normalize_lang(data.get('lang')) or lang_q
                if not isinstance(content, str):
                    self.send_error(400, "Invalid payload: missing 'content' string")
                    return
                cpath = canonical_path_for_lang(lang)
                with open(cpath, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Cache-Control', 'no-store')
                if lang:
                    set_lang_cookie(self, lang)
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'success', 'lang': lang or "zh", 'path': cpath}).encode('utf-8'))
            except Exception as e:
                self.send_error(500, str(e))
        else:
            self.send_error(404, "Not Found")

if __name__ == "__main__":
    mode, args = parse_cli(sys.argv[1:])
    if mode == "help":
        err = args.get("error")
        if err:
            print(f"Error: {err}")
        print("Usage:")
        print("  python3 server.py                 # serve (default port/env)")
        print("  python3 server.py 8000            # serve on port")
        print("  python3 server.py pack OUT.self   # pack project to .self (asks confirmation)")
        print("  python3 server.py pack OUT.self --yes")
        sys.exit(2)
    if mode == "pack":
        sys.exit(pack_self(str(args["out"]), yes=bool(args.get("yes"))))

    PORT = get_port(args.get("port"))
    CURRENT_PORT = PORT
    # Ensure we are running in the correct directory (optional safety check)
    if not os.path.exists(CANONICAL_PATH):
        print(f"Warning: {CANONICAL_PATH} not found in current directory.")
        
    base_url = f"http://127.0.0.1:{PORT}"
    if PORT != DEFAULT_PORT and len(sys.argv) < 2 and not (os.environ.get("SELFWARE_PORT") or os.environ.get("AUDP_PORT") or os.environ.get("PORT")):
        print(f"⚠️  Port {DEFAULT_PORT} is in use; switched to {PORT}")
    print(f"✅ Selfware Local Server running at {base_url}")
    print(f"➡️  Open: {base_url}/ (redirects to /views/self.html)")
    caps = capabilities_payload(base_url=base_url)
    print("🧩 Capabilities:")
    print(f"   - write_scope: {', '.join(caps['write_scope'])}")
    print(f"   - confirmation_required: {', '.join(caps['confirmation_required'])}")
    gi = caps['modules']['local_git']
    if gi.get('is_repo'):
        b = gi.get('branch') or "(detached)"
        h = (gi.get('head') or "")[:7]
        print(f"   - local_git: yes ({b} {h})")
    else:
        print("   - local_git: no")
    print("   - api: GET /api/capabilities")
    print(f"📂 Serving directory: {os.getcwd()}")
    
    class ReuseTCPServer(socketserver.TCPServer):
        allow_reuse_address = True

    # Security: Bind to localhost only to prevent external access
    with ReuseTCPServer(("127.0.0.1", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped.")
