# 🚀 Local & Self-Hosted AI Setup Guide for My AI

**My AI** runs 100% locally on your computer using **Ollama**, an open-source local LLM runner.

- **Zero Cloud API Keys Required**: No OpenAI, Anthropic, or Gemini subscriptions needed.
- **Complete Privacy**: All prompts, conversations, documents, and images stay strictly on your local machine.
- **Hardware Accelerated**: Automatically utilizes GPU (NVIDIA CUDA, Apple Metal, AMD ROCm) or CPU.

---

## 📋 Quick Setup (3 Steps)

### Step 1: Install Ollama

- **Windows**: Download installer from [ollama.com/download/windows](https://ollama.com/download/windows) and run setup.
- **macOS**: Download from [ollama.com/download/mac](https://ollama.com/download/mac) or run `brew install ollama`.
- **Linux**: Run `curl -fsSL https://ollama.com/install.sh | sh`.

---

### Step 2: Start Ollama & Download a Model

Open your terminal and pull the recommended **Llama 3.2** model:

```bash
# Pull the default balanced model (3B parameters ~2.0 GB)
ollama pull llama3.2
```

Make sure the Ollama background service is running:

```bash
ollama serve
```

*(If Ollama is already running in your Windows system tray or Mac menu bar, it is ready!)*

---

### Step 3: Start My AI

In the `my-ai` project directory:

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser to chat with your local AI!

---

## 🎯 Recommended Models for Your Hardware

| Capability | Recommended Model | Command | RAM Required |
| :--- | :--- | :--- | :--- |
| **General & Fast (Default)** | Llama 3.2 (3B) | `ollama pull llama3.2` | 4 GB RAM |
| **Ultra-Lightweight / Low CPU** | Llama 3.2 (1B) | `ollama pull llama3.2:1b` | 2 GB RAM |
| **Coding & Architecture** | Qwen 2.5 Coder (7B) | `ollama pull qwen2.5-coder:7b` | 8 GB RAM |
| **Deep Reasoning & Math** | DeepSeek R1 (7B) | `ollama pull deepseek-r1:7b` | 8 GB RAM |
| **Multimodal Vision** | Llama 3.2 Vision (11B) | `ollama pull llama3.2-vision` | 12 GB RAM / GPU |
| **Local Vector Embeddings** | Nomic Embed Text | `ollama pull nomic-embed-text` | 1 GB RAM |

---

## ⚙️ Changing the Active Local Model

Edit [.env.local](file:///.env.local) to switch your default model anytime:

```env
# Ollama Local Runtime Endpoint
OLLAMA_BASE_URL=http://localhost:11434

# Set your active model
OLLAMA_MODEL=llama3.2
DEFAULT_AI_MODEL=llama3.2
```

Restart your dev server (`npm run dev`) and My AI will instantly use the new model.

---

## 🔍 Verifying Local AI Connectivity

You can verify that Ollama is responding by visiting the health check endpoint:

- **Browser**: [http://localhost:3000/api/health](http://localhost:3000/api/health)
- **Terminal**:
  ```bash
  curl http://localhost:11434/api/tags
  ```

---

## 🔮 Future Independence: Training & Custom Models

You can package custom system prompts, fine-tuned weights, or localized models into Ollama:

1. Create a `Modelfile`:
   ```dockerfile
   FROM llama3.2
   SYSTEM "You are My AI, an autonomous local assistant with deep reasoning."
   PARAMETER temperature 0.7
   ```
2. Build the model:
   ```bash
   ollama create my-ai-v1 -f Modelfile
   ```
3. Set `OLLAMA_MODEL=my-ai-v1` in `.env.local`.
