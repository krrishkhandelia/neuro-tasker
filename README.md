# The Smart Companion (Neuro-Tasker)

## Overview
A neuro-inclusive task management application designed to bridge the Executive Function gap. It breaks down complex goals into "Micro-Wins" using a **Local-First AI (Llama-3)** approach for maximum privacy.

**Problem Statement:** PS1 (The Smart Companion)
**Key Features:**
* **Local AI:** Runs entirely on-device using Ollama (Zero data leaves the machine).
* **Neuro-Inclusive UI:** Focus Mode and Dyslexic-friendly typography.
* **Privacy:** PII Scrubbing + Local IndexedDB Storage.

## Tech Stack
* **Frontend:** Next.js 14 (React), Tailwind CSS
* **AI Engine:** Ollama (Llama-3 8B), running locally.
* **Database:** Dexie.js (IndexedDB)
* **Containerization:** Docker

## ⚠️ Prerequisites (Critical)
Since this app uses a Local LLM, the host machine must be running **Ollama**.
1.  Install [Ollama](https://ollama.com).
2.  Pull the model: `ollama pull llama3`
3.  Create the custom coach model:
    ```bash
    ollama create neuro-coach -f Modelfile
    ```
4.  **Start the AI Server:** Ensure `ollama serve` is running.
    * *Note:* The app expects Ollama to be accessible at `http://localhost:11434`.

## How to Run (Docker)
1.  **Build the Image:**
    ```bash
    docker build -t neuro-tasker .
    ```
2.  **Run the Container:**
    ```bash
    docker run -p 3000:3000 neuro-tasker
    ```
3.  Open `http://localhost:3000` in your browser.

## Project Structure
* `src/components/features`: Core logic (Voice, Focus Mode, Dashboard).
* `src/lib/ollama.ts`: Client-side connection to the Local AI.
* `Modelfile`: Custom system prompt instructions for the AI persona.