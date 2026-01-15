import React from "react";

export default function MessageBubble({ message }) {
  const isUser = message.type === "text_input";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        margin: "10px 0",
      }}
    >
      <div
        style={{
          background: isUser ? "#00897B" : "#E0E0E0",
          color: isUser ? "white" : "black",
          padding: "10px 15px",
          borderRadius: 15,
          maxWidth: "60%",
        }}
      >
        {message.media_url && (
          <img
            src={message.media_url}
            alt="Sign"
            width="200"
            style={{ borderRadius: 10 }}
          />
        )}
        <p style={{ margin: 6 }}>{message.content}</p>
      </div>
    </div>
  );
}
