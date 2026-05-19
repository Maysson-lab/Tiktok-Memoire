import express from "express";
import path from "path";
import "dotenv/config";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import os from "os";

// Initialize external clients
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route
  app.post("/api/summarize", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || !url.includes("tiktok.com")) {
        return res.status(400).json({ error: "Invalid TikTok URL provided." });
      }

      console.log(`[1/4] Fetching metadata for ${url} via TikWM...`);
      // Step 1: Fetch TikTok data (Mocking the yt-dlp part)
      const tikwmUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
      const metaRes = await fetch(tikwmUrl);
      const metaJson: any = await metaRes.json();
      
      if (!metaJson || metaJson.code !== 0 || !metaJson.data) {
        throw new Error("Could not extract TikTok data");
      }

      const videoData = metaJson.data;
      const videoPlayUrl = videoData.play;
      const videoId = videoData.id;

      console.log(`[2/4] Downloading video ${videoId}...`);
      // Step 2: Download video (Alternative to ffmpeg/yt-dlp)
      const downloadRes = await fetch(videoPlayUrl);
      const buffer = await downloadRes.arrayBuffer();
      
      // Save locally to a temp folder, imitating backend/downloads/
      const downloadsDir = path.join(process.cwd(), "downloads");
      if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);
      
      const filePath = path.join(downloadsDir, `${videoId}.mp4`);
      fs.writeFileSync(filePath, Buffer.from(buffer));

      console.log(`[3/4] Transcribing and Summarizing via AI...`);
      // Step 3: Transcription + AI Summary (Replacing Whisper + OpenRouter with Gemini Multimodal for simplicity in Node)
      // Upload media to Gemini File API
      const file = await ai.files.upload({
         file: filePath,
         config: { mimeType: "video/mp4" },
      });

      // Simple prompt acting as the brain
      const prompt = `You are a "Second Brain" assistant for short videos. 
1. Transcribe the audio from this video as accurately as possible.
2. Provide a concise bulleted summary of the core concepts, takeaways, or events.
Format your response as a JSON object with 'transcription' and 'summary' keys. Only return the JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { fileData: { fileUri: file.uri, mimeType: file.mimeType } },
          prompt
        ],
        config: {
          responseMimeType: "application/json",
        }
      });
      
      let aiResult;
      try {
        aiResult = JSON.parse(response.text || "{}");
      } catch (e) {
         // Fallback if parsing fails
         console.warn("Failed to parse JSON, falling back to raw output");
         aiResult = { transcription: response.text, summary: response.text };
      }

      console.log(`[4/4] Saving to Database...`);
      // Step 4: Save to DB (Supabase)
      const entry = {
        tiktok_url: url,
        video_id: videoId,
        author: videoData.author?.nickname || 'Unknown',
        title: videoData.title || '',
        transcription: aiResult.transcription || 'No transcription available',
        summary: aiResult.summary || 'No summary available',
        created_at: new Date().toISOString()
      };

      if (supabase) {
        const { error } = await supabase.from('tiktok_summaries').insert([entry]);
        if (error) console.error("Supabase insert error:", error);
      } else {
        console.warn("Supabase not configured, skipping DB insert.");
      }

      // Cleanup
      try { fs.unlinkSync(filePath); } catch (e) {}

      res.json({ success: true, data: entry });

    } catch (error: any) {
      console.error("Error processing video:", error);
      res.status(500).json({ error: error.message || "An unexpected error occurred" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
