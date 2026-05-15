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