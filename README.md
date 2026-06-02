# OpenClaw + Ollama Quick Commands

## Install Ollama (macOS)
```bash
brew install ollama
ollama --version
```

## Start Ollama with this project's existing model directory
```bash
export OLLAMA_MODELS=/Users/simonking/OpenClawSandbox/ollama_data/models
ollama serve
```

## Download models
```bash
ollama pull qwen2.5:7b
ollama pull mistral:7b
ollama pull nomic-embed-text:latest
```

## Verify downloaded models
```bash
ollama list
```

## Tailscale (secure remote access to OpenClaw)

Use Tailscale Serve to expose your local OpenClaw gateway on your tailnet.

### 1) Make sure Tailscale is connected
```bash
tailscale up
```

### 2) Publish OpenClaw port 18789 on your tailnet
```bash
tailscale serve --bg 18789
```

### 3) Check current Serve config
```bash
tailscale serve status
```

Expected result should look like:
```text
https://<your-device>.<your-tailnet>.ts.net (tailnet only)
|-- / proxy http://127.0.0.1:18789
```

### 4) Reset and recreate Serve config (if needed)
```bash
tailscale serve reset
tailscale serve --bg 18789
tailscale serve status
```

### Optional: public internet access
If you want internet-accessible exposure (not just tailnet), use Funnel:
```bash
tailscale funnel 18789
```

Note: Keep OpenClaw bound to loopback for safety; Tailscale Serve handles secure access.

## Update OpenClaw to a new version

### 1) Pull the latest image and recreate the container
```bash
docker compose pull openclaw
docker compose up -d --force-recreate openclaw
```

### Full clean restart (optional)
```bash
docker compose down
docker compose pull openclaw
docker compose up -d
```

### Clean up old unused images (optional)
```bash
docker image prune -f
```

---

## Connecting a new browser (device pairing)

When opening the Control UI in a new browser, you may see a **"Device pairing required"** screen.

### 1) List pending devices
```bash
docker exec openclaw-gateway node dist/index.js devices list
```

### 2) Approve the device
Copy the device ID from the pairing screen and run:
```bash
docker exec openclaw-gateway node dist/index.js devices approve <device-id>
```

Example:
```bash
docker exec openclaw-gateway node dist/index.js devices approve f8a7757c-52d3-42f0-af77-5ad217133775
```

### 3) Reconnect
After approval, click **Reconnect** (or reload the page) in your browser.

---

## Offline mode: use Ollama as primary
```bash
docker exec openclaw-gateway node dist/index.js config set agents.defaults.model.primary ollama/qwen2.5:7b
```

## Back to Bedrock when online
```bash
docker exec openclaw-gateway node dist/index.js config set agents.defaults.model.primary amazon-bedrock/openai.gpt-oss-20b-1:0
```

## tmux quick use (keep Ollama running in background)

### 1) Create or attach a session
```bash
tmux new -s ollama
# or, if it already exists:
tmux attach -t ollama
```

### 2) Split panes
```text
Ctrl+B then %    # vertical split (left/right)
Ctrl+B then "    # horizontal split (top/bottom)
```

### 3) Detach / reattach
```text
Ctrl+B then D    # detach and keep processes running
tmux attach -t ollama
```

### 4) Run Ollama in one pane
```bash
export OLLAMA_MODELS=/Users/simonking/OpenClawSandbox/ollama_data/models
ollama serve
```