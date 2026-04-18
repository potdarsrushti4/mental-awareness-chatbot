# Mindful Chat

A beginner-friendly mental wellness chatbot built with Next.js, serverless API routes, and Hugging Face Inference Providers.

## Features

- Clean responsive chat UI
- User and assistant messages with simple in-memory browser state
- Serverless `/api/chat` route for Hugging Face chat completions
- Safety-focused assistant instructions for empathetic, non-medical support
- Ready for Vercel deployment

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` from `.env.example`:

   ```bash
   HF_TOKEN=your_hugging_face_token_here
   HF_MODEL=meta-llama/Llama-3.1-8B-Instruct:fastest
   ```

   Create a Hugging Face token with permission to make calls to Inference Providers.

3. Run the app:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000`.

## Deploying To Vercel

1. Push this project to a Git repository.
2. Import the repository in Vercel.
3. Add `HF_TOKEN` in the Vercel project environment variables.
4. Optionally add `HF_MODEL` to choose a different Hugging Face chat model.
5. Deploy.

## Safety Note

This app is for supportive reflection only. It should not diagnose, prescribe treatment, or replace professional or emergency care.
