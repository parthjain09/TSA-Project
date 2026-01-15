import React from "react";

export default function Layout({ children, onNav, current }) {
  return (
    <div>
      <nav style={{ padding: 12, borderBottom: "1px solid #ddd", display: "flex", gap: 8 }}>
        <button onClick={() => onNav("communicate")} style={{ fontWeight: current === "communicate" ? "bold" : "normal" }}>
          Communicate
        </button>
        <button onClick={() => onNav("history")} style={{ fontWeight: current === "history" ? "bold" : "normal" }}>
          History
        </button>
        <button onClick={() => onNav("about")} style={{ fontWeight: current === "about" ? "bold" : "normal" }}>
          About
        </button>
      </nav>
      <main>{children}</main>
    </div>
  );
}
