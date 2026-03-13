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
import re
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

LLM_BASE_URL = (os.environ.get("SELFWARE_LLM_BASE_URL") or "https://api.stepfun.com/v1").rstrip("/")
LLM_MODEL = os.environ.get("SELFWARE_LLM_MODEL") or "step-3.5-flash"
LLM_API_KEY = os.environ.get("SELFWARE_LLM_API_KEY") or ""


def strip_markdown_fences(text: str) -> str:
    s = (text or "").strip()
    if s.startswith("```"):
        lines = s.splitlines()
        if lines:
            lines = lines[1:]
        while lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        return "\n".join(lines).strip()
    return s


def call_openai_compatible_chat(messages, temperature: float = 0.2, timeout: int = 120) -> str:
    if not LLM_API_KEY:
        raise RuntimeError("SELFWARE_LLM_API_KEY is not configured")
    payload = {
        "model": LLM_MODEL,
        "messages": messages,
        "temperature": temperature,
    }
    req = urllib.request.Request(
        LLM_BASE_URL + "/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {LLM_API_KEY}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read().decode("utf-8", errors="replace")
    data = json.loads(raw)
    content = (((data.get("choices") or [{}])[0].get("message") or {}).get("content")) or ""
    content = strip_markdown_fences(content)
    if not isinstance(content, str) or not content.strip():
        raise RuntimeError("LLM returned empty content")
    return content


def build_self_protocol_edit_messages(protocol_text: str, current_content: str, instruction: str, lang: str, selection: str = "", history: list = None):
    now_ts = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    tag = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d-%H%M%S")
    system = (
        "You are Selfware Edit Copilot. "
        "You modify ONLY the canonical content file, never the protocol file. "
        "Follow the Selfware protocol exactly: canonical content is the authority for instance data; "
        "writes must stay within content scope; preserve structure unless the user explicitly asks to restructure.\n\n"
        "MEMORY MODULE (Section 10.3):\n"
        "Every change to canonical content MUST be accompanied by a Change Record. "
        "You are responsible for generating this record — the server will write it to content/memory/changes.md.\n\n"
        "RESPONSE FORMAT (MANDATORY — three sections separated by exact delimiters):\n\n"
        "1. Output the FULL updated canonical markdown content.\n"
        "2. On a new line, output exactly: ===REPLY===\n"
        "   Then write a brief conversational reply (1-3 sentences) in the user's language describing what you changed.\n"
        "3. On a new line, output exactly: ===CHANGE_RECORD===\n"
        "   Then output a YAML block (no fences) for the Change Record with these fields:\n"
        f"   id: \"chg-{tag}-chat_edit\"\n"
        f"   timestamp: \"{now_ts}\"\n"
        "   actor: \"user+agent\"\n"
        "   intent: (the user's instruction, concise)\n"
        "   paths: (list of affected file paths)\n"
        "   summary: (human-readable summary of what changed and why)\n"
        "   rollback_hint: \"git checkout -- <paths>\"\n\n"
        "If no changes are needed, still output the original content, then ===REPLY=== explaining why, "
        "then ===CHANGE_RECORD=== with intent stating no changes were made."
    )
    if selection:
        system += (
            " The user has selected a specific passage from the document. "
            "Focus your edit on or around that selected text according to the user's instruction. "
            "Keep all other parts of the document unchanged unless the instruction explicitly says otherwise."
        )
    msgs = [{"role": "system", "content": system}]
    if history:
        for h in history:
            role = h.get("role")
            text = h.get("text", "")
            if role in ("user", "assistant") and text:
                msgs.append({"role": role, "content": text})
    user_parts = [f"Language: {lang or 'zh'}\n"]
    if selection:
        user_parts.append(f"Selected text:\n\"\"\"{selection}\"\"\"\n")
    user_parts.append(f"User instruction:\n{instruction}\n")
    user_parts.append(f"Relevant Selfware protocol:\n{protocol_text}\n")
    user_parts.append(f"Current canonical content:\n{current_content}")
    user = "\n".join(user_parts)
    msgs.append({"role": "user", "content": user})
    return msgs


REPLY_DELIMITER = "===REPLY==="
CHANGE_RECORD_DELIMITER = "===CHANGE_RECORD==="
MEMORY_CHANGES_PATH = "content/memory/changes.md"


def parse_edit_response(raw: str):
    """Split LLM output into (updated_content, reply, change_record_yaml)."""
    content, reply, change_yaml = raw.strip(), "", ""
    if CHANGE_RECORD_DELIMITER in content:
        content, change_yaml = content.split(CHANGE_RECORD_DELIMITER, 1)
        change_yaml = change_yaml.strip()
    if REPLY_DELIMITER in content:
        content, reply = content.split(REPLY_DELIMITER, 1)
        reply = reply.strip()
    return content.strip(), reply, change_yaml


def write_change_record(change_yaml: str):
    """Append a model-generated Change Record to memory. Server is just the writer, model is the author."""
    if not change_yaml:
        return
    cleaned = change_yaml.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        lines = lines[1:]
        while lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    chg_id = ""
    for line in cleaned.splitlines():
        if line.strip().startswith("id:"):
            chg_id = line.split(":", 1)[1].strip().strip('"').strip("'")
            break
    record = f"\n---\n\n## id: {chg_id}\n\n```yaml\n{cleaned}\n```\n"
    os.makedirs(os.path.dirname(MEMORY_CHANGES_PATH), exist_ok=True)
    with open(MEMORY_CHANGES_PATH, "a", encoding="utf-8") as f:
        f.write(record)

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
            "chat_edit": "/api/chat_edit",
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
        elif parsed.path == '/api/articles':
            # List all articles in content/articles/ grouped by date
            try:
                import glob
                articles_dir = 'content/articles'
                articles = []
                
                # Use glob to find all markdown files
                pattern = os.path.join(articles_dir, '*.md')
                files = glob.glob(pattern)
                
                for filepath in sorted(files, reverse=True):
                    filename = os.path.basename(filepath)
                    try:
                        with open(filepath, 'r', encoding='utf-8') as f:
                            content = f.read(2000)
                        
                        # Extract date from filename (YYYY-MM-DD-title.md)
                        date_match = re.match(r'^(\d{4}-\d{2}-\d{2})', filename)
                        date = date_match.group(1) if date_match else None
                        
                        # Extract title from front matter or filename
                        title = filename.replace('.md', '')
                        front_title = re.search(r'^title:\s*["\']?(.+?)["\']?\s*$', content, re.MULTILINE)
                        if front_title:
                            title = front_title.group(1).strip()
                        
                        # Extract category/tags
                        category = None
                        cat_match = re.search(r'^category:\s*["\']?(.+?)["\']?\s*$', content, re.MULTILINE)
                        if cat_match:
                            category = cat_match.group(1).strip()
                        
                        # Count articles (total_articles field)
                        total = None
                        total_match = re.search(r'total_articles:\s*(\d+)', content)
                        if total_match:
                            total = int(total_match.group(1))
                        
                        articles.append({
                            'filename': filename,
                            'path': f'{articles_dir}/{filename}',
                            'date': date,
                            'title': title,
                            'category': category,
                            'total_articles': total,
                            'size': os.path.getsize(filepath)
                        })
                    except Exception as e:
                        continue
                
                # Group by year-month
                grouped = {}
                for art in articles:
                    date = art.get('date') or 'unknown'
                    year_month = date[:7] if len(date) >= 7 else date
                    if year_month not in grouped:
                        grouped[year_month] = []
                    grouped[year_month].append(art)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Cache-Control', 'no-store')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'articles': articles,
                    'grouped': grouped,
                    'total': len(articles),
                    'directory': articles_dir
                }).encode('utf-8'))
            except Exception as e:
                self.send_error(500, str(e))
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
        elif parsed.path == '/api/chat_edit':
            try:
                content_len = int(self.headers.get('Content-Length'))
                post_body = self.rfile.read(content_len)
                data = json.loads(post_body.decode('utf-8'))

                instruction = data.get('instruction')
                selection = data.get('selection', '')
                history = data.get('history') or []
                lang = normalize_lang(data.get('lang')) or lang_q or 'zh'
                if not isinstance(instruction, str) or not instruction.strip():
                    self.send_error(400, "Invalid payload: missing 'instruction' string")
                    return
                if not isinstance(selection, str):
                    selection = ''
                if not isinstance(history, list):
                    history = []

                cpath = canonical_path_for_lang(lang)
                ppath = protocol_path_for_lang(lang)
                with open(cpath, 'r', encoding='utf-8') as f:
                    current_content = f.read()
                with open(ppath, 'r', encoding='utf-8') as f:
                    protocol_text = f.read()

                messages = build_self_protocol_edit_messages(
                    protocol_text=protocol_text,
                    current_content=current_content,
                    instruction=instruction,
                    lang=lang,
                    selection=selection.strip(),
                    history=history,
                )
                raw_output = call_openai_compatible_chat(messages)
                if not isinstance(raw_output, str) or not raw_output.strip():
                    raise RuntimeError("Model returned empty updated content")

                updated_content, reply, change_yaml = parse_edit_response(raw_output)
                if not updated_content:
                    raise RuntimeError("Model returned empty content after parsing")

                with open(cpath, 'w', encoding='utf-8') as f:
                    f.write(updated_content)

                # Section 10.3: model-generated Change Record → memory
                try:
                    write_change_record(change_yaml)
                except Exception as mem_err:
                    print(f"Warning: failed to write change record: {mem_err}")

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Cache-Control', 'no-store')
                set_lang_cookie(self, lang)
                self.end_headers()
                self.wfile.write(json.dumps({
                    'status': 'success',
                    'mode': 'chat_edit',
                    'lang': lang,
                    'path': cpath,
                    'instruction': instruction,
                    'reply': reply,
                    'content': updated_content,
                }).encode('utf-8'))
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

    bind_host = os.environ.get("SELFWARE_HOST") or "127.0.0.1"
    display_host = bind_host if bind_host != "0.0.0.0" else "127.0.0.1"
    base_url = f"http://{display_host}:{PORT}"
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

    # Bind host configurable via SELFWARE_HOST; default exposed for direct access.
    with ReuseTCPServer((bind_host, PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped.")
