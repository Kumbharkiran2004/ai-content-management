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

// =========================
// MONGODB
// =========================

const client = new MongoClient(process.env.MONGODB_URI);

let contentsCollection;

// =========================
// GEMINI AI
// =========================

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// =========================
// CONNECT TO MONGODB
// =========================

async function connectDatabase() {
    await client.connect();

    const db = client.db("ai_content_db");

    contentsCollection = db.collection("contents");

    console.log("MongoDB Connected Successfully!");
}

// =========================
// HEALTH CHECK
// =========================

app.get("/", (req, res) => {
    res.json({
        message: "AI Content Management System Backend is Running!",
        database: "MongoDB",
        ai: "Google Gemini"
    });
});

// =========================
// GEMINI AI CONTENT GENERATOR
// =========================

app.post("/api/ai/generate", async (req, res) => {
    try {
        const { topic, tone, contentType } = req.body;

        if (!topic) {
            return res.status(400).json({
                message: "Topic is required"
            });
        }

        const selectedTone = tone || "professional";

        const selectedContentType =
            contentType || "blog post";

        const prompt = `
Create a ${selectedContentType} about "${topic}".

Tone: ${selectedTone}

Requirements:
- Write clear and engaging content.
- Include a suitable title.
- Make the content useful and easy to understand.
- Use proper grammar.
- Return only the generated content.
`;

        // Generate content using Gemini
        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: prompt
        });

        const generatedContent = response.text;

        // =========================
        // SAVE AI CONTENT TO MONGODB
        // =========================

        const newContent = {
            title: `${topic} - AI Generated Content`,
            content: generatedContent,
            topic: topic,
            tone: selectedTone,
            contentType: selectedContentType,
            createdAt: new Date(),
            updatedAt: new Date(),
            generatedBy: "Google Gemini"
        };

        const result =
            await contentsCollection.insertOne(newContent);

        // =========================
        // SEND RESPONSE
        // =========================

        res.status(201).json({
            message: "AI content generated and saved successfully",
            id: result.insertedId,
            topic: topic,
            tone: selectedTone,
            contentType: selectedContentType,
            content: generatedContent
        });

    } catch (error) {
        console.error(
            "Gemini Generation Error:",
            error
        );

        res.status(500).json({
            message: "Failed to generate AI content",
            error: error.message
        });
    }
});

// =========================
// GET ALL CONTENT
// =========================

app.get("/api/content", async (req, res) => {
    try {
        const contents = await contentsCollection
            .find()
            .sort({ createdAt: -1 })
            .toArray();

        res.json(contents);

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch content",
            error: error.message
        });
    }
});

// =========================
// CREATE CONTENT
// =========================

app.post("/api/content", async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                message: "Title and content are required"
            });
        }

        const newContent = {
            title: title,
            content: content,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result =
            await contentsCollection.insertOne(
                newContent
            );

        res.status(201).json({
            message: "Content created successfully",
            id: result.insertedId,
            data: newContent
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create content",
            error: error.message
        });
    }
});

// =========================
// UPDATE CONTENT
// =========================

app.put("/api/content/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { title, content } = req.body;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid content ID"
            });
        }

        if (!title || !content) {
            return res.status(400).json({
                message: "Title and content are required"
            });
        }

        const result =
            await contentsCollection.updateOne(
                {
                    _id: new ObjectId(id)
                },
                {
                    $set: {
                        title: title,
                        content: content,
                        updatedAt: new Date()
                    }
                }
            );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                message: "Content not found"
            });
        }

        res.json({
            message: "Content updated successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update content",
            error: error.message
        });
    }
});

// =========================
// DELETE CONTENT
// =========================

app.delete("/api/content/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid content ID"
            });
        }

        const result =
            await contentsCollection.deleteOne({
                _id: new ObjectId(id)
            });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                message: "Content not found"
            });
        }

        res.json({
            message: "Content deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete content",
            error: error.message
        });
    }
});

// =========================
// START SERVER
// =========================

async function startServer() {
    try {
        await connectDatabase();

        app.listen(PORT, () => {
            console.log(
                `Server running on port ${PORT}`
            );
        });

    } catch (error) {
        console.error(
            "Database connection failed:",
            error.message
        );

        process.exit(1);
    }
}

startServer();
