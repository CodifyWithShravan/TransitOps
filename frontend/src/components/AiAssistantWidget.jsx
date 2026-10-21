import { useState, useRef, useEffect } from "react";
import { api } from "../services/api";
import {
  SparklesIcon,
  BotIcon,
  RefreshCwIcon,
  XIcon,
  FileTextIcon,
  SendIcon,
  TruckIcon,
  PaperclipIcon,
} from "./Icons";

export default function AiAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [ragActive, setRagActive] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Persistent conversation ID for conversation memory
  const [conversationId] = useState(() => {
    let id = localStorage.getItem("transitops_ai_convo_id");
    if (!id) {
      id = "transitops-" + crypto.randomUUID().slice(0, 8);
      localStorage.setItem("transitops_ai_convo_id", id);
    }
    return id;
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, loading, isOpen, isMinimized]);

  const handleSendMessage = async (textOverride) => {
    const textToSend = textOverride || message;
    if (!textToSend.trim() || loading) return;

    const userText = textToSend.trim();
    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setMessage("");
    setLoading(true);

    try {
      let reply = "";
      if (ragActive) {
        reply = await api.sendRagChatMessage(userText);
      } else {
        reply = await api.sendChatMessage(userText, conversationId);
      }
      setMessages((prev) => [...prev, { role: "ai", content: reply }]);
    } catch (err) {
      console.error("AI Assistant error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            "I'm having trouble connecting to the AI backend. Please verify that the TransitOps Spring Boot server is running on port 8080.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setUploadStatus("Only PDF documents are allowed.");
      return;
    }

    setSelectedFile(file);
    setUploading(true);
    setUploadStatus(`Indexing ${file.name}...`);

    try {
      await api.uploadPdfDocument(file);
      setUploadStatus("PDF indexed into Vector Store! RAG active.");
      setRagActive(true);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: `Document Indexed: Successfully parsed and indexed **${file.name}**. I can now answer questions grounded in this document!`,
        },
      ]);
    } catch (err) {
      setUploadStatus(err.message || "Failed to index PDF");
    } finally {
      setUploading(false);
    }
  };

  const handleNewChat = () => {
    const newId = "transitops-" + crypto.randomUUID().slice(0, 8);
    localStorage.setItem("transitops_ai_convo_id", newId);
    setMessages([]);
    setRagActive(false);
    setSelectedFile(null);
    setUploadStatus("");
  };

  return (
    <div className="ai-widget-container">
      {/* Dockable Floating Trigger */}
      {!isOpen && (
        <button
          className="ai-floating-btn"
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          title="Open TransitOps Operations Copilot"
        >
          <div className="ai-btn-glow"></div>
          <SparklesIcon size={18} className="ai-sparkle-icon" />
          <div className="ai-btn-text">
            <strong>TransitOps AI</strong>
            <small>Operations Copilot</small>
          </div>
          {messages.length > 0 && (
            <span className="ai-badge">{messages.length}</span>
          )}
        </button>
      )}

      {/* Floating Window */}
      {isOpen && (
        <div className={`ai-chat-window ${isMinimized ? "minimized" : ""}`}>
          {/* Header */}
          <div className="ai-window-header">
            <div className="ai-header-left">
              <div className="ai-badge-icon">
                <BotIcon size={16} />
              </div>
              <div>
                <h4>TransitOps AI Assistant</h4>
                <div className="ai-status-row">
                  <span className="ai-live-dot"></span>
                  <small>
                    {ragActive ? "RAG Knowledge Mode" : "Ops Memory Active"}
                  </small>
                </div>
              </div>
            </div>

            <div className="ai-header-actions">
              <button
                className="ai-icon-btn"
                onClick={handleNewChat}
                title="Start new conversation"
              >
                <RefreshCwIcon size={13} />
              </button>
              <button
                className="ai-icon-btn"
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? "▲" : "▼"}
              </button>
              <button
                className="ai-icon-btn"
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                <XIcon size={14} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Document Banner / RAG Bar */}
              <div className="ai-rag-bar">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />

                <div className="rag-bar-info">
                  <span className="rag-pill">
                    {ragActive ? "RAG Active" : "Operational Memory"}
                  </span>
                  {selectedFile ? (
                    <span className="rag-file-name" title={selectedFile.name}>
                      <FileTextIcon size={12} style={{ marginRight: "4px" }} />
                      {selectedFile.name}
                    </span>
                  ) : (
                    <span className="rag-hint">
                      Upload PDF to ground answers
                    </span>
                  )}
                </div>

                <button
                  className="rag-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <PaperclipIcon size={13} style={{ marginRight: "4px" }} />
                  {uploading ? "Indexing..." : "Attach PDF"}
                </button>
              </div>

              {uploadStatus && (
                <div className="ai-upload-alert">{uploadStatus}</div>
              )}

              {/* Message Transcript */}
              <div className="ai-messages-scroll">
                {messages.length === 0 ? (
                  <div className="ai-empty-welcome">
                    <div className="welcome-emoji">
                      <TruckIcon size={32} />
                    </div>
                    <h5>How can I assist your operations?</h5>
                    <p>
                      Query live fleet telemetry, trip dispatch readiness, driver
                      compliance status, or operational cost breakdown.
                    </p>

                    <div className="ai-suggestions">
                      <button
                        onClick={() =>
                          handleSendMessage("Which vehicles are currently available for dispatch?")
                        }
                      >
                        Available vehicles?
                      </button>
                      <button
                        onClick={() =>
                          handleSendMessage("How do I complete a trip with final odometer and expenses?")
                        }
                      >
                        Trip completion guide
                      </button>
                      <button
                        onClick={() =>
                          handleSendMessage("What are the driver safety license compliance rules?")
                        }
                      >
                        Driver safety rules
                      </button>
                    </div>
                  </div>
                ) : (
                  messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`ai-bubble-row ${
                        m.role === "user" ? "user-side" : "ai-side"
                      }`}
                    >
                      <div className="ai-bubble-avatar">
                        {m.role === "user" ? "You" : "AI"}
                      </div>
                      <div className="ai-bubble-text">
                        <div className="ai-bubble-author">
                          {m.role === "user" ? "You" : "TransitOps AI"}
                        </div>
                        <div className="ai-bubble-content">{m.content}</div>
                      </div>
                    </div>
                  ))
                )}

                {loading && (
                  <div className="ai-bubble-row ai-side">
                    <div className="ai-bubble-avatar">AI</div>
                    <div className="ai-bubble-text">
                      <div className="ai-typing">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="ai-input-box">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask TransitOps AI (Enter to send)..."
                  rows={2}
                  disabled={loading}
                />
                <button
                  className="ai-send-btn"
                  onClick={() => handleSendMessage()}
                  disabled={loading || !message.trim()}
                  title="Send message"
                >
                  <SendIcon size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
