import { useEffect, useState } from "react";

const API_URL = "http://3.6.12.215:5000";

function App() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Friendly");
  const [contentType, setContentType] = useState("Article");

  const [generatedContent, setGeneratedContent] = useState("");
  const [savedContent, setSavedContent] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Load saved content from MongoDB
  const loadSavedContent = async () => {
    try {
      const response = await fetch(`${API_URL}/api/content`);

      if (!response.ok) {
        throw new Error("Failed to load content");
      }

      const data = await response.json();
      setSavedContent(data);
    } catch (error) {
      console.error(error);
      setMessage("Saved content load झाला नाही.");
    }
  };

  useEffect(() => {
    loadSavedContent();
  }, []);

  // Generate AI content
  const generateContent = async () => {
    if (!topic.trim()) {
      setMessage("कृपया Topic enter करा.");
      return;
    }

    setLoading(true);
    setMessage("");
    setGeneratedContent("");

    try {
      const response = await fetch(`${API_URL}/api/ai/generate`, {
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

      setGeneratedContent(data.content);
      setMessage("AI content successfully generated.");
    } catch (error) {
      console.error(error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Save generated content to MongoDB
  const saveToMongoDB = async () => {
    if (!generatedContent.trim()) {
      setMessage("आधी AI content generate करा.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          tone,
          contentType,
          content: generatedContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Save failed");
      }

      setMessage("Content MongoDB मध्ये successfully save झाला.");

      // MongoDB मधून fresh list आणा
      await loadSavedContent();
    } catch (error) {
      console.error(error);
      setMessage(`Save Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Delete content
  const deleteContent = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/content/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Delete failed");
      }

      setMessage("Content delete झाला.");

      // Fresh MongoDB data
      await loadSavedContent();
    } catch (error) {
      console.error(error);
      setMessage(`Delete Error: ${error.message}`);
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div>
          <h1>AI Content Management System</h1>
          <p>Generate, manage and store AI-powered content</p>
        </div>

        <div className="status">
          <span className="status-dot"></span>
          Backend Online
        </div>
      </header>

      <main className="container">
        {/* AI Generator */}
        <section className="card">
          <h2>AI Content Generator</h2>

          <p className="subtitle">
            AI वापरून content तयार करा.
          </p>

          {/* Topic */}
          <label>Topic</label>

          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="उदा. Artificial Intelligence in Healthcare"
          />

          {/* Tone */}
          <label>Tone</label>

          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
          >
            <option value="Friendly">Friendly</option>
            <option value="Professional">Professional</option>
            <option value="Formal">Formal</option>
            <option value="Creative">Creative</option>
            <option value="Simple">Simple</option>
          </select>

          {/* Content Type */}
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

          {/* Generate */}
          <button
            className="generate-btn"
            onClick={generateContent}
            disabled={loading}
          >
            {loading
              ? "Generating..."
              : "✨ Generate AI Content"}
          </button>

          {message && (
            <div className="message">
              {message}
            </div>
          )}
        </section>

        {/* Generated Content */}
        {generatedContent && (
          <section className="card">
            <div className="section-header">
              <div>
                <h2>Generated Content</h2>
                <p className="subtitle">
                  AI ने तयार केलेले content
                </p>
              </div>

              <button
                className="save-btn"
                onClick={saveToMongoDB}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "💾 Save to MongoDB"}
              </button>
            </div>

            <div className="generated-content">
              <h3>{topic}</h3>

              <div className="content-text">
                {generatedContent.split("\n").map((line, index) => (
                  <p key={index}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Saved Content */}
        <section className="card">
          <h2>Saved Content</h2>

          <p className="subtitle">
            MongoDB मध्ये save केलेले content
          </p>

          {savedContent.length === 0 ? (
            <div className="empty">
              अजून कोणतेही content save केलेले नाही.
            </div>
          ) : (
            <div className="saved-list">
              {savedContent.map((item) => (
                <div className="saved-item" key={item._id}>
                  <div className="saved-header">
                    <h3>{item.topic}</h3>

                    <button
                      className="delete-btn"
                      onClick={() => deleteContent(item._id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>

                  <div className="meta">
                    <span>
                      Tone: {item.tone}
                    </span>

                    <span>
                      Type: {item.contentType}
                    </span>
                  </div>

                  <div className="saved-content">
                    {item.content
                      ?.split("\n")
                      .map((line, index) => (
                        <p key={index}>
                          {line}
                        </p>
                      ))}
                  </div>

                  {item.createdAt && (
                    <small>
                      Created:{" "}
                      {new Date(item.createdAt).toLocaleString()}
                    </small>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
