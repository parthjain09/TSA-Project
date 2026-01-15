import React, { useState } from "react";
import CameraCapture from "../components/CameraCapture";
import MessageBubble from "../components/MessageBubble";

// Helper: send file to server to analyze sign image
async function sendSignImage(file) {
  const form = new FormData();
  form.append("file", file);
  const resp = await fetch("http://localhost:4000/api/translate-sign", {
    method: "POST",
    body: form
  });
  return await resp.json();
}

// Helper: request generated sign image for a text prompt
async function generateSignImage(text) {
  const resp = await fetch("http://localhost:4000/api/generate-sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
  return await resp.json();
}

export default function Communicate() {
  const [messages, setMessages] = useState([]);
  const [textInput, setTextInput] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTextToSign = async () => {
    if (!textInput.trim()) return;
    setLoading(true);
    const userMessage = { type: "text_input", content: textInput };
    setMessages((prev) => [...prev, userMessage]);

    // Call backend to generate sign image
    try {
      const result = await generateSignImage(textInput);
      if (result.ok && result.image) {
        const signMessage = {
          type: "text_to_sign",
          content: textInput,
          media_url: result.image,
        };
        setMessages((prev) => [...prev, signMessage]);
      } else {
        setMessages((prev) => [...prev, { type: "error", content: result.error || "Image generation failed" }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { type: "error", content: err.message || "Image generation error" }]);
    }
    setTextInput("");
    setLoading(false);
  };

  const handleCapture = async (file) => {
    setLoading(true);
    // Show the captured image
    const objectUrl = URL.createObjectURL(file);
    setMessages((prev) => [...prev, {
      type: "sign_to_text",
      content: "[sign image]",
      media_url: objectUrl,
    }]);

    // Send to backend for analysis
    try {
      const result = await sendSignImage(file);
      if (result.ok && result.text) {
        setMessages((prev) => [...prev, {
          type: "sign_translation",
          content: result.text,
        }]);
      } else {
        setMessages((prev) => [...prev, { type: "error", content: result.error || "Sign analysis failed" }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { type: "error", content: err.message || "Sign analysis error" }]);
    }
    setShowCamera(false);
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>SignBridge Chat</h2>
      {loading && <div style={{ color: '#888', marginBottom: 8 }}>Loading...</div>}
      <div>
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
      </div>
      {showCamera && <CameraCapture onCapture={handleCapture} />}
      <div style={{ marginTop: 12 }}>
        <input
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Type a message..."
          style={{ width: "70%", padding: 8 }}
          disabled={loading}
        />
        <button onClick={handleTextToSign} style={{ marginLeft: 8 }} disabled={loading}>
          Send
        </button>
        <button onClick={() => setShowCamera(true)} style={{ marginLeft: 8 }} disabled={loading}>
          Capture Sign
        </button>
      </div>
    </div>
  );
}
