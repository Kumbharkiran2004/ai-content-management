import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://3.6.12.215:5000";

function App() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Friendly");
  const [contentType, setContentType] = useState("Article");

  const [generatedContent, setGeneratedContent] = useState(null);
  const [savedContent, setSavedContent] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load saved content from MongoDB
  const loadSavedContent = async () => {
    try {
      const response = await fetch(`${API_URL}/api/content`);

      if (!response.ok) {
        throw new Error("Failed to load content");
      }

      const data = await response.json();
      setSavedContent(data);
    } catch (err) {
      console.error(err);
      setError("Saved content load झाला नाही.");
    }
  };

  useEffect(() => {
    loadSavedContent();
  }, []);

  // Generate AI content
  const generateAIContent = async () => {
    setMessage("");
    setError("");

    if (!topic.trim()) {
      setError("कृपया Topic enter करा.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          tone,
          contentType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI generation failed");
      }

      setGeneratedContent({
        title: data.title || `${topic} - AI Generated Content`,
        content: data.content || "",
      });

      setMessage("AI content successfully generated.");
    } catch (err) {
      console.error(err);
      setError(err.message || "AI content generate झाला नाही.");
    } finally {
      setLoading(false);
    }
  };

  // Save generated content to MongoDB
  const saveToMongoDB = async () => {
    if (!generatedContent) {
      setError("Save करण्यासाठी आधी content generate करा.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch(`${API_URL}/api/content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: generatedContent.title,
          content: generatedContent.content,
          topic,
          tone,
          contentType,
          generatedBy: "AI",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Save failed");
      }

      setMessage("Content MongoDB मध्ये successfully save झाले.");

      await loadSavedContent();
    } catch (err) {
      console.error(err);
      setError(err.message || "Content save झाला नाही.");
    } finally {
      setSaving(false);
    }
  };

  // Delete content
  const deleteContent = async (id) => {
    try {
      setError("");
      setMessage("");

      const response = await fetch(`${API_URL}/api/content/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Delete failed");
      }

      setMessage("Content successfully deleted.");

      await loadSavedContent();
    } catch (err) {
      console.error(err);
      setError(err.message || "Content delete झाला नाही.");
    }
  };

  // Simple markdown-style content renderer
  const renderContent = (content) => {
    if (!content) return null;

    return content.split("\n").map((line, index) => {
      const trimmed = line.trim();

      if (!trimmed) {
        return <br key={index} />;
      }

      if (trimmed.startsWith("### ")) {
        return <h3 key={index}>{trimmed.replace("### ", "")}</h3>;
      }

      if (trimmed.startsWith("## ")) {
        return <h2 key={index}>{trimmed.replace("## ", "")}</h2>;
      }

      if (trimmed.startsWith("# ")) {
        return <h1 key={index}>{trimmed.replace("# ", "")}</h1>;
      }

      if (/^\d+\.\s/.test(trimmed)) {
        return (
          <h3 key={index}>
            {trimmed}
          </h3>
        );
      }

      return <p key={index}>{trimmed}</p>;
    });
  };

  return (
    <div className="app">
      <div className="container">

        {/* Header */}
        <header className="header">
          <h1>🤖 AI Content Management System</h1>

          <p>
            Generate, manage and store AI-powered content
          </p>

          <div className="backend-status">
            🟢 Backend Online
          </div>
        </header>

        {/* AI Generator */}
        <section className="card">
          <h2>✨ AI Content Generator</h2>

          <p>
            Fill in the details below to generate AI-powered content.
          </p>

          <div className="form-grid">

            {/* Topic */}
            <div className="form-group">
              <label>Topic</label>

              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Artificial Intelligence in Education"
              />
            </div>

            {/* Tone */}
            <div className="form-group">
              <label>Tone</label>

              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                <option value="Friendly">Friendly</option>
                <option value="Professional">Professional</option>
                <option value="Creative">Creative</option>
                <option value="Formal">Formal</option>
                <option value="Casual">Casual</option>
              </select>
            </div>

            {/* Content Type */}
            <div className="form-group">
              <label>Content Type</label>

              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
              >
                <option value="Article">Article</option>
                <option value="Blog Post">Blog Post</option>
                <option value="Marketing Content">
                  Marketing Content
                </option>
                <option value="Social Media Post">
                  Social Media Post
                </option>
                <option value="Product Description">
                  Product Description
                </option>
              </select>
            </div>

          </div>

          <button
            className="generate-btn"
            onClick={generateAIContent}
            disabled={loading}
          >
            {loading
              ? "⏳ Generating..."
              : "✨ Generate AI Content"}
          </button>

          {message && (
            <div className="message success">
              {message}
            </div>
          )}

          {error && (
            <div className="message error">
              {error}
            </div>
          )}
        </section>

        {/* Generated Content */}
        {generatedContent && (
          <section className="card">
            <div className="generated-header">
              <div>
                <h2>📄 Generated Content</h2>

                <p>
                  AI ने तयार केलेले content
                </p>
              </div>

              <button
                className="save-btn"
                onClick={saveToMongoDB}
                disabled={saving}
              >
                {saving
                  ? "⏳ Saving..."
                  : "💾 Save Content"}
              </button>
            </div>

            <div className="generated-content">
              <h1>{generatedContent.title}</h1>

              {renderContent(generatedContent.content)}
            </div>
          </section>
        )}

        {/* Saved Content */}
        <section className="card">
          <h2>🗄️ Saved Content</h2>

          <p>
            Your saved AI-generated content
          </p>

          {savedContent.length === 0 ? (
            <div className="empty-state">
              <h3>📄 No saved content yet</h3>

              <p>
                Generate and save some content to see it here.
              </p>
            </div>
          ) : (
            savedContent.map((item) => (
              <div
                className="saved-item"
                key={item._id}
              >
                <h3>{item.title}</h3>

                <p>
                  <strong>Topic:</strong>{" "}
                  {item.topic || "N/A"}
                </p>

                <p>
                  <strong>Tone:</strong>{" "}
                  {item.tone || "N/A"}
                </p>

                <p>
                  <strong>Type:</strong>{" "}
                  {item.contentType || "N/A"}
                </p>

                <div>
                  {renderContent(item.content)}
                </div>

                <button
                  className="delete-btn"
                  onClick={() => deleteContent(item._id)}
                >
                  🗑️ Delete
                </button>
              </div>
            ))
          )}
        </section>

      </div>
    </div>
  );
}

export default App;
