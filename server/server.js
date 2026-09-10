const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ObjectId } = require("mongodb");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 5000;

// ===============================
// ENVIRONMENT VARIABLES
// ===============================

const MONGODB_URI = process.env.MONGODB_URI;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI is missing in .env");
  process.exit(1);
}

if (!GEMINI_API_KEY) {
  console.error("ERROR: GEMINI_API_KEY is missing in .env");
  process.exit(1);
}

// ===============================
// MONGODB
// ===============================

const mongoClient = new MongoClient(MONGODB_URI);

let contentsCollection;

// ===============================
// GEMINI AI
// ===============================

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

const GEMINI_MODEL = "gemini-3.1-flash-lite";

// ===============================
// ROOT ROUTE
// ===============================

app.get("/", (req, res) => {
  res.json({
    message: "AI Content Management System Backend is Running!",
    ai: "Google Gemini",
    model: GEMINI_MODEL,
    status: "online",
  });
});

// ===============================
// GET ALL CONTENT
// ===============================

app.get("/api/content", async (req, res) => {
  try {
    const contents = await contentsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.json(contents);
  } catch (error) {
    console.error("GET CONTENT ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch content",
      error: error.message,
    });
  }
});

// ===============================
// GET SINGLE CONTENT
// ===============================

app.get("/api/content/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid content ID",
      });
    }

    const content = await contentsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!content) {
      return res.status(404).json({
        message: "Content not found",
      });
    }

    res.json(content);
  } catch (error) {
    console.error("GET SINGLE CONTENT ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch content",
      error: error.message,
    });
  }
});

// ===============================
// GEMINI AI CONTENT GENERATOR
// ===============================

app.post("/api/generate", async (req, res) => {
  try {
    const {
      topic,
      tone = "Friendly",
      contentType = "Article",
    } = req.body;

    console.log("Generating Gemini content...");
    console.log("Topic:", topic);
    console.log("Tone:", tone);
    console.log("Content Type:", contentType);

    if (!topic || !topic.trim()) {
      return res.status(400).json({
        message: "Topic is required",
      });
    }

    const prompt = `
You are an expert AI content writer.

Create high-quality content based on the following information.

Topic:
${topic}

Tone:
${tone}

Content Type:
${contentType}

Requirements:
- Write clear and engaging content.
- Match the requested tone.
- Match the requested content type.
- Do not mention that you are an AI.
- Do not add unnecessary explanations.
- Return only the final content.
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const generatedText = response.text;

    if (!generatedText || !generatedText.trim()) {
      throw new Error("Gemini returned empty content");
    }

    const newContent = {
      topic: topic.trim(),
      tone,
      contentType,
      content: generatedText.trim(),
      generatedBy: "Google Gemini",
      model: GEMINI_MODEL,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await contentsCollection.insertOne(newContent);

    console.log("Gemini content generated successfully!");
    console.log("Saved Content ID:", result.insertedId);

    res.status(201).json({
      message: "AI content generated and saved successfully",
      content: {
        _id: result.insertedId,
        ...newContent,
      },
    });
  } catch (error) {
    console.error("GEMINI GENERATION ERROR:", error);

    res.status(500).json({
      message: "Gemini content generation failed",
      error: error.message,
    });
  }
});

// ===============================
// CREATE CONTENT MANUALLY
// ===============================

app.post("/api/content", async (req, res) => {
  try {
    const {
      topic,
      tone,
      contentType,
      content,
    } = req.body;

    if (!content) {
      return res.status(400).json({
        message: "Content is required",
      });
    }

    const newContent = {
      topic: topic || "",
      tone: tone || "",
      contentType: contentType || "Article",
      content,
      generatedBy: "Manual",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await contentsCollection.insertOne(newContent);

    res.status(201).json({
      message: "Content created successfully",
      content: {
        _id: result.insertedId,
        ...newContent,
      },
    });
  } catch (error) {
    console.error("CREATE CONTENT ERROR:", error);

    res.status(500).json({
      message: "Failed to create content",
      error: error.message,
    });
  }
});

// ===============================
// UPDATE CONTENT
// ===============================

app.put("/api/content/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid content ID",
      });
    }

    const {
      topic,
      tone,
      contentType,
      content,
    } = req.body;

    const updateData = {
      updatedAt: new Date(),
    };

    if (topic !== undefined) {
      updateData.topic = topic;
    }

    if (tone !== undefined) {
      updateData.tone = tone;
    }

    if (contentType !== undefined) {
      updateData.contentType = contentType;
    }

    if (content !== undefined) {
      updateData.content = content;
    }

    const result = await contentsCollection.updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: updateData,
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "Content not found",
      });
    }

    res.json({
      message: "Content updated successfully",
    });
  } catch (error) {
    console.error("UPDATE CONTENT ERROR:", error);

    res.status(500).json({
      message: "Failed to update content",
      error: error.message,
    });
  }
});

// ===============================
// DELETE CONTENT
// ===============================

app.delete("/api/content/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid content ID",
      });
    }

    const result = await contentsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "Content not found",
      });
    }

    res.json({
      message: "Content deleted successfully",
    });
  } catch (error) {
    console.error("DELETE CONTENT ERROR:", error);

    res.status(500).json({
      message: "Failed to delete content",
      error: error.message,
    });
  }
});

// ===============================
// START SERVER
// ===============================

async function startServer() {
  try {
    await mongoClient.connect();

    console.log("MongoDB Connected Successfully!");

    const database = mongoClient.db("ai_content_management");

    contentsCollection = database.collection("contents");

    console.log("MongoDB Database Ready!");
    console.log("Google Gemini AI Generator is Ready!");
    console.log("Gemini Model:", GEMINI_MODEL);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("SERVER START ERROR:", error);
    process.exit(1);
  }
}

startServer();

// ===============================
// GRACEFUL SHUTDOWN
// ===============================

process.on("SIGINT", async () => {
  console.log("Shutting down server...");

  await mongoClient.close();

  process.exit(0);
});
