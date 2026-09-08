const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ObjectId } = require("mongodb");
const OpenAI = require("openai");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 5000;

// MongoDB
const client = new MongoClient(process.env.MONGODB_URI);
let contentsCollection;

// OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Connect to MongoDB
async function connectDatabase() {
    await client.connect();

    const db = client.db("ai_content_db");
    contentsCollection = db.collection("contents");

    console.log("MongoDB Connected Successfully!");
}

// Health check
app.get("/", (req, res) => {
    res.json({
        message: "AI Content Management System Backend is Running!",
        database: "MongoDB",
        ai: "OpenAI"
    });
});

// =========================
// AI CONTENT GENERATOR
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
        const selectedContentType = contentType || "blog post";

        const prompt = `
Create a ${selectedContentType} about "${topic}".

Tone: ${selectedTone}

Requirements:
- Write clear and engaging content.
- Use a suitable title.
- Make the content useful and easy to understand.
- Return only the generated content.
`;

        const response = await openai.responses.create({
            model: "gpt-5.6",
            input: prompt
        });

        const generatedContent = response.output_text;

        res.json({
            message: "AI content generated successfully",
            topic,
            tone: selectedTone,
            contentType: selectedContentType,
            content: generatedContent
        });

    } catch (error) {
        console.error("AI Generation Error:", error);

        res.status(500).json({
            message: "Failed to generate AI content",
            error: error.message
        });
    }
});

// =========================
// MONGODB CRUD
// =========================

// Get all content
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

// Create content
app.post("/api/content", async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                message: "Title and content are required"
            });
        }

        const newContent = {
            title,
            content,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await contentsCollection.insertOne(newContent);

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

// Update content
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

        const result = await contentsCollection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    title,
                    content,
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

// Delete content
app.delete("/api/content/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid content ID"
            });
        }

        const result = await contentsCollection.deleteOne({
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
            console.log(`Server running on port ${PORT}`);
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
