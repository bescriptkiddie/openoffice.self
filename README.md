# open-office.self

Selfware Open Office is a local-first demo runtime for the Selfware protocol.

## Repository Scope

This repository keeps the current protocol and runtime only.
Historic `v0.x` snapshot files are intentionally removed to avoid fragmented version docs.

## Main Files

- `selfware.md`: primary protocol document
- `selfware.en.md`: English protocol document
- `manifest.md`: runtime and packaging manifest
- `server.py`: local HTTP runtime and `.self` pack command
- `content/selfware_demo.md`: canonical Chinese content source
- `content/selfware_demo.en.md`: canonical English content source
- `views/`: projection views (self, doc, canvas, outline, mindmap, presentation, card)

## Quick Start

1. Clone this repository into your agent's working directory.
2. Ask your agent to run the project:

   > Run open-office.self for me.

The agent will start the local runtime and open the interactive views in your browser.

<details>
<summary>Manual setup (Python details)</summary>

**Requirements:** Python 3 (standard library only, zero dependencies).

```bash
python server.py
```

Open `http://127.0.0.1:8000/`.

If port `8000` is occupied, the runtime will pick the next free local port.
You can also set a fixed port:

```bash
SELFWARE_PORT=8001 python server.py
```

</details>

## Pack to `.self`

```bash
python server.py pack ./OpenOffice.self
python server.py pack ./OpenOffice.self --yes
```

## Runtime Guardrails

- Localhost only (`127.0.0.1`)
- Write scope limited to `content/`
- Explicit confirmation required for high-impact actions (pack/publish/pull-merge/apply updates)

## License

MIT. See `LICENSE`.
