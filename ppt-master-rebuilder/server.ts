import express from "express";
import path from "path";
import multer from "multer";
import pptxgen from "pptxgenjs";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Global Offsets Calibration configuration class
export class GlobalOffsets {
  offsetX: number; // inches
  offsetY: number; // inches
  scaleX: number;
  scaleY: number;

  constructor(offsetX = 0, offsetY = 0, scaleX = 1.0, scaleY = 1.0) {
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.scaleX = scaleX;
    this.scaleY = scaleY;
  }

  // Adjust coordinate values safely (Widescreen slides are 10.0 x 5.625 inches)
  applyX(xPercent: number): number {
    const baseW = 10.0;
    const val = (xPercent / 100) * baseW * this.scaleX + this.offsetX;
    return Math.max(0, Math.min(baseW, val));
  }

  applyY(yPercent: number): number {
    const baseH = 5.625;
    const val = (yPercent / 100) * baseH * this.scaleY + this.offsetY;
    return Math.max(0, Math.min(baseH, val));
  }

  applyW(wPercent: number): number {
    const baseW = 10.0;
    return Math.max(0.1, Math.min(baseW, (wPercent / 100) * baseW * this.scaleX));
  }

  applyH(hPercent: number): number {
    const baseH = 5.625;
    return Math.max(0.1, Math.min(baseH, (hPercent / 100) * baseH * this.scaleY));
  }
}

const app = express();
const PORT = 3000;

// Enable JSON bodies with higher limits to support base64 assets can pass easily
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Configure Multer memory storage for direct file ingestion
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB file cap
});

// Real-time progress monitoring endpoints or memory buffer
// Since we want to support real-time feedback, we can use a tracking list
const activeRebuildJobs = new Map<string, {
  status: string;
  progress: number;
  log: string[];
  layers?: any;
}>();

// Helper to update progress status of a job
function updateJob(jobId: string, progress: number, status: string, message: string) {
  const current = activeRebuildJobs.get(jobId) || { status, progress, log: [] };
  current.status = status;
  current.progress = progress;
  current.log.push(`[${new Date().toLocaleTimeString()}] ${message}`);
  activeRebuildJobs.set(jobId, current);
}

// 1. Progress Status monitoring API Route
app.get("/api/rebuild/progress/:jobId", (req, res) => {
  const job = activeRebuildJobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: "Job ID not found" });
  }
  res.json(job);
});

// 2. Base Rebuild analysis routing with X-API-Key handling
app.post("/api/rebuild/analyze", upload.single("file"), async (req, res) => {
  const apiKey = (req.headers["x-api-key"] as string) || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return res.status(401).json({
      error: "Missing API Key. Please provide a valid Gemini API Key in the top-level settings."
    });
  }

  const jobId = Math.random().toString(36).substring(2, 10);
  activeRebuildJobs.set(jobId, { status: "INITIATING", progress: 5, log: [] });

  // Read offsets
  const offsetX = parseFloat(req.body.offsetX || "0");
  const offsetY = parseFloat(req.body.offsetY || "0");
  const scaleX = parseFloat(req.body.scaleX || "1");
  const scaleY = parseFloat(req.body.scaleY || "1");
  const offsets = new GlobalOffsets(offsetX, offsetY, scaleX, scaleY);

  const styleGuide = req.body.styleGuide || "Professional Business Clean Modern Theme";

  // Respond immediately with jobId so frontend can start polling
  res.json({ jobId });

  // Execute processing asynchronously
  (async () => {
    try {
      updateJob(jobId, 10, "ANALYZING_FILE", "Parsing uploaded file headers and structure...");

      let fileBase64 = "";
      let mimeType = "application/pdf";

      if (req.file) {
        fileBase64 = req.file.buffer.toString("base64");
        mimeType = req.file.mimetype;
        updateJob(jobId, 20, "ANALYZING_FILE", `Received file: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);
      } else {
        updateJob(jobId, 20, "ANALYZING_FILE", "No custom file uploaded. Proceeding with interactive starter layout generation...");
      }

      updateJob(jobId, 35, "GEMINI_AI_ANALYSIS", "Calling Gemini 2.0/3.5 Flash for Visual layout breakdown...");

      // Initialize GoogleGenAI SDK
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });

      // Prepare payload to Gemini
      let contents: any[] = [];
      let promptText = `You are a PPT Layout Structuring specialist. Your job is to perform a visual layout structure redraw detection.
Analyze the slide information provided (or synthesize a stunning slide presentation decks based on style requirements if no file input is provided).
Style rules to enforce: ${styleGuide}

You must return a raw JSON object detailing the slides design, strictly matching this TypeScript structure:
{
  "slides": [
    {
      "slideIndex": number,
      "background": {
        "color": string (hex e.g. "FFFFFF" or "F3F4F6"),
        "theme": "light" | "dark"
      },
      "shapes": [
        {
          "type": "rectangle" | "round-rect" | "line" | "ellipse",
          "x": number (0 to 100 percentage of width),
          "y": number (0 to 100 percentage of height),
          "w": number (0 to 100 percentage scale width),
          "h": number (0 to 100 percentage scale height),
          "fill": string (hex color code e.g. "2563EB"),
          "border": { "color": string, "width": number } | null
        }
      ],
      "texts": [
        {
          "text": string,
          "fontSize": number (points, standard like 12, 18, 24, 32),
          "color": string (hex color code e.g. "1F2937"),
          "bold": boolean,
          "italic": boolean,
          "alignment": "left" | "center" | "right",
          "x": number (0 to 100 percentage coordinates),
          "y": number (0 to 100 percentage coordinates),
          "w": number (0 to 100 percentage coordinates),
          "h": number (0 to 100 percentage coordinates),
          "role": "header" | "subtitle" | "body" | "caption"
        }
      ]
    }
  ]
}

Enforce elegant margins, visual grids, clean card shapes, contrasting subtitles, and balanced layout.
Do NOT output anything other than of raw JSON matching this schema. No markdown formatting blocks or surrounding text.`;

      if (fileBase64) {
        contents.push({
          inlineData: {
            data: fileBase64,
            mimeType: mimeType
          }
        });
        promptText += "\nAnalyze this slide source document visually and redraw all shapes and texts precisely.";
      } else {
        promptText += "\nGenerate a 3-slide stateful presentation structure: Slide 1 (Executive Summary Title Slide), Slide 2 (Structured Features Comparison Grid with custom decorative card shapes), Slide 3 (Visual Data Analytics Breakdown & Metrics nodes).";
      }

      contents.push(promptText);

      const geminiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              slides: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    slideIndex: { type: Type.INTEGER },
                    background: {
                      type: Type.OBJECT,
                      properties: {
                        color: { type: Type.STRING },
                        theme: { type: Type.STRING }
                      },
                      required: ["color", "theme"]
                    },
                    shapes: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          type: { type: Type.STRING },
                          x: { type: Type.NUMBER },
                          y: { type: Type.NUMBER },
                          w: { type: Type.NUMBER },
                          h: { type: Type.NUMBER },
                          fill: { type: Type.STRING },
                          border: {
                            type: Type.OBJECT,
                            nullable: true,
                            properties: {
                              color: { type: Type.STRING },
                              width: { type: Type.NUMBER }
                            }
                          }
                        },
                        required: ["type", "x", "y", "w", "h"]
                      }
                    },
                    texts: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          text: { type: Type.STRING },
                          fontSize: { type: Type.NUMBER },
                          color: { type: Type.STRING },
                          bold: { type: Type.BOOLEAN },
                          italic: { type: Type.BOOLEAN },
                          alignment: { type: Type.STRING },
                          x: { type: Type.NUMBER },
                          y: { type: Type.NUMBER },
                          w: { type: Type.NUMBER },
                          h: { type: Type.NUMBER },
                          role: { type: Type.STRING }
                        },
                        required: ["text", "fontSize", "x", "y", "w", "h"]
                      }
                    }
                  },
                  required: ["slideIndex", "background", "shapes", "texts"]
                }
              }
            },
            required: ["slides"]
          }
        }
      });

      const extractedText = geminiResponse.text?.trim() || "{}";
      const parsedData = JSON.parse(extractedText);

      updateJob(jobId, 60, "RECONSTRUCTING_PPTX", "Layout analytical map parsed successfully! Generating native PPTX slides...");

      // Initialize pptxgenjs
      const ppx = new pptxgen();
      ppx.layout = "LAYOUT_16x9";

      const receivedSlides = parsedData.slides || [];
      updateJob(jobId, 70, "RECONSTRUCTING_PPTX", `Discovered ${receivedSlides.length} layout layers. Deploying Background + Vector shapes + Typography Textboxes...`);

      // Draw each slide based on the layouts elements and offsets
      for (const slideData of receivedSlides) {
        const slide = ppx.addSlide();

        // 1. Background layer
        const bgColor = slideData.background?.color || "FFFFFF";
        slide.background = { fill: bgColor };

        // 2. Vector Shape layers
        const vectorShapes = slideData.shapes || [];
        for (const shape of vectorShapes) {
          // coordinate conversion and micro adjustments offsets
          const sX = offsets.applyX(shape.x);
          const sY = offsets.applyY(shape.y);
          const sW = offsets.applyW(shape.w);
          const sH = offsets.applyH(shape.h);

          // Get exact PPTX shape type
          let shapeType: any = ppx.ShapeType.rect;
          if (shape.type === "round-rect") shapeType = ppx.ShapeType.roundRect;
          if (shape.type === "ellipse") shapeType = ppx.ShapeType.ellipse;
          if (shape.type === "line") shapeType = ppx.ShapeType.line;

          const shapeOptions: any = {
            x: sX,
            y: sY,
            w: sW,
            h: sH,
            fill: { color: shape.fill || "E5E7EB" }
          };

          if (shape.border) {
            shapeOptions.line = {
              color: shape.border.color || "BDC3C7",
              width: shape.border.width || 1
            };
          }

          slide.addShape(shapeType, shapeOptions);
        }

        // 3. Text typographic text boxes layer
        const textElements = slideData.texts || [];
        for (const text of textElements) {
          const tX = offsets.applyX(text.x);
          const tY = offsets.applyY(text.y);
          const tW = offsets.applyW(text.w);
          const tH = offsets.applyH(text.h);

          slide.addText(text.text, {
            x: tX,
            y: tY,
            w: tW,
            h: tH,
            fontSize: text.fontSize || 12,
            color: text.color || "2C3E50",
            bold: !!text.bold,
            italic: !!text.italic,
            align: text.alignment || "left",
            valign: "middle",
            breakLine: true
          });
        }
      }

      updateJob(jobId, 85, "PACKAGING_FILE", "All native shape layers layout completed. Serializing presentation binary bytes...");

      // Write representation CJS binary buffer
      const buffer = await (ppx as any).write("nodebuffer") as Buffer;
      
      // Save elements structure to show in user preview logs
      const jobRecord = activeRebuildJobs.get(jobId);
      if (jobRecord) {
        jobRecord.layers = parsedData;
        jobRecord.log.push(`[${new Date().toLocaleTimeString()}] Native PowerPoint Presentation rebuilt successfully compiled!`);
        // store the buffer
        (jobRecord as any).pptxBuffer = buffer;
        jobRecord.status = "COMPLETED";
        jobRecord.progress = 100;
        activeRebuildJobs.set(jobId, jobRecord);
      }

    } catch (err: any) {
      console.error(err);
      const jobRecord = activeRebuildJobs.get(jobId) || { status: "FAILED", progress: 0, log: [] };
      jobRecord.status = "FAILED";
      jobRecord.progress = 0;
      jobRecord.log.push(`[Fatal Error] Rebuild analysis crashed: ${err.message || err}`);
      activeRebuildJobs.set(jobId, jobRecord);
    }
  })();
});

// Binary download PPTX route
app.get("/api/rebuild/download/:jobId", (req, res) => {
  const job = activeRebuildJobs.get(req.params.jobId);
  if (!job || !(job as any).pptxBuffer) {
    return res.status(404).send("Document not available for download or has expired.");
  }

  res.setHeader("Content-Disposition", "attachment; filename=PPT_Master_Rebuilt_Presentation.pptx");
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
  res.send((job as any).pptxBuffer);
});

// Initialize Vite in Development, otherwise serve static assets from dist
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
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
    console.log(`PPT-Master-Rebuilder server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
