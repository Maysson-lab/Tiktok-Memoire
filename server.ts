import express from "express";
import path from "path";
import "dotenv/config";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";

// Initialize external clients
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const downloadsDir = path.join(process.cwd(), "downloads");
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);
const upload = multer({ dest: downloadsDir });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route
  app.post("/api/summarize", upload.single("file"), async (req, res) => {
    try {
      const { url } = req.body;
      const file = req.file;

      if (!url && !file) {
        return res.status(400).json({ error: "Please provide a valid TikTok URL or upload an MP4 file." });
      }

      let filePath = "";
      let videoId = "";
      let videoData: any = {};
      let isFile = !!file;

      if (isFile) {
        console.log(`[1/4] Processing uploaded file...`);
        filePath = file!.path;
        videoId = file!.filename;
        videoData = {
          author: { nickname: 'Local Upload' },
          title: file!.originalname,
          id: videoId
        };
      } else {
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

        videoData = metaJson.data;
        const videoPlayUrl = videoData.play;
        videoId = videoData.id;

        console.log(`[2/4] Downloading video ${videoId}...`);
        // Step 2: Download video
        const downloadRes = await fetch(videoPlayUrl);
        const buffer = await downloadRes.arrayBuffer();
        
        filePath = path.join(downloadsDir, `${videoId}.mp4`);
        fs.writeFileSync(filePath, Buffer.from(buffer));
      }

      console.log(`[3/4] Transcribing and Summarizing via AI...`);
      // Step 3: Transcription + AI Summary (Replacing Whisper + OpenRouter with Gemini Multimodal for simplicity in Node)
      // Upload media to Gemini File API
      const aiFile = await ai.files.upload({
         file: filePath,
         config: { mimeType: "video/mp4" },
      });

      console.log(`[3.5/4] Waiting for AI file to become active...`);
      let fileState = await ai.files.get({ name: aiFile.name });
      let attempts = 0;
      while (fileState.state !== "ACTIVE" && fileState.state !== "FAILED" && attempts < 30) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        fileState = await ai.files.get({ name: aiFile.name });
        attempts++;
      }

      if (fileState.state === "FAILED" || fileState.state !== "ACTIVE") {
        throw new Error("Video processing failed by Gemini or took too long to become active.");
      }

      // Simple prompt acting as the brain
      const prompt = `Tu es un assistant "Second Cerveau" pour des vidéos courtes. 
1. Transcris l'audio de cette vidéo le plus précisément possible en français.
2. Fournis un résumé concis sous forme de liste à puces des concepts clés, points à retenir ou événements en français.
3. Génère 3 à 5 tags/mots-clés pertinents en français (ex: "Productivité", "Développement Web", "Recette").
Format ton retour uniquement en JSON comme ceci:
{
  "transcription": "...",
  "summary": "...",
  "tags": ["tag1", "tag2", "tag3"]
}
Retourne seulement le JSON sans blocs de code markdown.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { fileData: { fileUri: aiFile.uri, mimeType: aiFile.mimeType } },
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

      console.log(`[4/4] Saving to Database & Bucket...`);
      
      let bucketUrl = isFile ? "" : url;
      if (supabase) {
        try {
          const fileBuffer = fs.readFileSync(filePath);
          const finalFilename = `${videoId}.mp4`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("videos")
            .upload(finalFilename, fileBuffer, {
              contentType: 'video/mp4',
              upsert: true
            });
            
          if (!uploadError && uploadData) {
            const { data: publicUrlData } = supabase.storage.from("videos").getPublicUrl(finalFilename);
            bucketUrl = publicUrlData.publicUrl;
            console.log("Uploaded to Supabase bucket:", bucketUrl);
          } else {
             console.log("Bucket upload warning (did you create the 'videos' bucket?):", uploadError?.message);
          }
        } catch (err) {
          console.error("Bucket upload err:", err);
        }
      }

      // Step 4: Save to DB (Supabase)
      let finalTranscription = typeof aiResult.transcription === 'string' ? aiResult.transcription : 
                               Array.isArray(aiResult.transcription) ? aiResult.transcription.join('\n') :
                               JSON.stringify(aiResult.transcription) || 'No transcription available';
      let finalSummary = typeof aiResult.summary === 'string' ? aiResult.summary : 
                         Array.isArray(aiResult.summary) ? aiResult.summary.join('\n') :
                         JSON.stringify(aiResult.summary) || 'No summary available';

      const tags = Array.isArray(aiResult.tags) ? aiResult.tags : [];
      let entry: any = {
        tiktok_url: bucketUrl || url || "local_upload",
        video_id: videoId,
        author: videoData.author?.nickname || 'Unknown',
        title: videoData.title || '',
        transcription: finalTranscription,
        summary: finalSummary,
        tags: tags,
        is_favorite: false,
        notes: '',
        created_at: new Date().toISOString()
      };

      if (supabase) {
        // Try to insert with new columns
        const { error, data: insertedData } = await supabase.from('tiktok_summaries').insert([entry]).select().single();
        if (error) {
           if (error.code === '42703') { // Column does not exist
             console.warn("New columns not found, using legacy schema.");
             const fallbackEntry = { ...entry };
             delete fallbackEntry.tags;
             delete fallbackEntry.is_favorite;
             delete fallbackEntry.notes;
             
             const { error: fallbackError, data: fallbackData } = await supabase.from('tiktok_summaries').insert([fallbackEntry]).select().single();
             if (fallbackError) {
                console.error("Supabase insert error:", fallbackError);
                return res.status(500).json({ error: `Database error: ${fallbackError.message}` });
             } else {
                entry = fallbackData;
             }
           } else {
             console.error("Supabase insert error:", error.message || JSON.stringify(error));
             return res.status(500).json({ error: `Database error: ${error.message}` });
           }
        } else {
           entry = insertedData;
        }
      } else {
        console.warn("Supabase not configured, skipping DB insert.");
      }

      // Cleanup locally
      try { fs.unlinkSync(filePath); } catch (e) {}

      res.json({ success: true, data: entry });

    } catch (error: any) {
      console.error("Error processing video:", error);
      res.status(500).json({ error: error.message || "An unexpected error occurred" });
    }
  });

  app.get("/api/history", async (req, res) => {
    if (!supabase) return res.json({ history: [] });
    const { data, error } = await supabase.from('tiktok_summaries').select('*').order('created_at', { ascending: false });
    if (error) {
       console.error("Supabase fetch error:", error);
       return res.status(500).json({ error: error.message });
    }
    res.json({ history: data || [] });
  });

  app.patch("/api/videos/:id", async (req, res) => {
    if (!supabase) return res.status(500).json({ error: "Supabase not configured" });
    const { id } = req.params;
    const updates = req.body; // e.g. { tags, notes, is_favorite, transcription }

    const { data, error } = await supabase.from('tiktok_summaries').update(updates).eq('id', id).select().single();
    if (error) {
       console.error("Supabase update error:", error);
       return res.status(500).json({ error: error.message });
    }
    res.json({ success: true, data });
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
