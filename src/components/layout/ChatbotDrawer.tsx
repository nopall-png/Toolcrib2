"use client";

import React, { useState, useEffect, useRef } from "react";
import { User } from "@/types/user";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

interface ChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function ChatbotDrawer({ isOpen, onClose, user }: ChatbotDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [draftedFile, setDraftedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const displayName = user ? user.fullName : "John Hardward";

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const renderMessageContent = (text: string) => {
    // 1. Escape basic HTML tags to prevent XSS
    let formatted = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // 2. Replace **bold** with <strong>bold</strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // 3. Replace *italic* with <em>italic</em>
    formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // 4. Replace `code` with <code class="bg-zinc-950 px-1 py-0.5 rounded text-red-400 font-mono text-[9px]">$1</code>
    formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-zinc-950 px-1 py-0.5 rounded text-red-400 font-mono text-[9px]">$1</code>');

    // 5. Replace newlines with <br />
    formatted = formatted.replace(/\n/g, "<br />");

    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() && !draftedFile) return;

    const fileToSend = draftedFile;
    const captionToSend = textToSend;

    // Reset inputs immediately
    setInputText("");
    setDraftedFile(null);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Show upload + caption user message in bubble
    const userMessageText = fileToSend 
      ? `📄 Mengunggah file: **${fileToSend.name}**` + (captionToSend ? `\n\n"${captionToSend}"` : "")
      : captionToSend;

    const userMessage: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: userMessageText,
      timestamp: timeStr,
    };

    setMessages((prev: Message[]) => [...prev, userMessage]);

    // 1. Process Upload if file is present
    if (fileToSend) {
      const uploadLoadingMsgId = Math.random().toString();
      const uploadLoadingMessage: Message = {
        id: uploadLoadingMsgId,
        sender: "bot",
        text: `Mengunggah dan mempelajari ${fileToSend.name}...`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev: Message[]) => [...prev, uploadLoadingMessage]);

      try {
        const formData = new FormData();
        formData.append("file", fileToSend);

        const uploadRes = await fetch("http://localhost:8000/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("Gagal mengunggah file.");
        }

        const uploadData = await uploadRes.json();
        
        // Remove loading message and add response
        setMessages((prev: Message[]) => prev.filter(m => m.id !== uploadLoadingMsgId));

        if (uploadData.status === 'success') {
          const successMessage: Message = {
            id: Math.random().toString(),
            sender: "bot",
            text: `Berhasil memuat file **${fileToSend.name}** ke memori sesi sementara. Anda sekarang dapat menanyakan informasi terkait isi file ini!`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev: Message[]) => [...prev, successMessage]);
        } else {
          const failMessage: Message = {
            id: Math.random().toString(),
            sender: "bot",
            text: `Gagal membaca file: ${uploadData.message}`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev: Message[]) => [...prev, failMessage]);
          return; // Stop flow
        }
      } catch (err) {
        setMessages((prev: Message[]) => prev.filter(m => m.id !== uploadLoadingMsgId));
        const connectionErrorMessage: Message = {
          id: Math.random().toString(),
          sender: "bot",
          text: `Terjadi kesalahan koneksi ke server saat mengunggah file.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev: Message[]) => [...prev, connectionErrorMessage]);
        return; // Stop flow
      }
    }

    // 2. Process Chat Query if caption/text is present
    if (captionToSend) {
      try {
        const response = await fetch("http://localhost:8000/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ message: captionToSend })
        });

        if (!response.ok) {
          throw new Error("Gagal terhubung ke API backend.");
        }

        const data = await response.json();
        
        const botMessage: Message = {
          id: Math.random().toString(),
          sender: "bot",
          text: data.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        
        setMessages((prev: Message[]) => [...prev, botMessage]);
      } catch (error) {
        const errorMessage: Message = {
          id: Math.random().toString(),
          sender: "bot",
          text: "Maaf, asisten gagal merespons. Pastikan server Backend Python (FastAPI) Anda sudah dijalankan.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev: Message[]) => [...prev, errorMessage]);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputText);
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
        />
      )}

      {/* Drawer Body */}
      <div
        onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
        className={`fixed top-4 bottom-4 right-4 w-80 bg-neutral-900 border border-zinc-800 rounded-[20px] shadow-2xl z-50 transition-all duration-350 ease-out flex flex-col justify-between overflow-hidden ${
          isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
        }`}
      >
        {/* Drag and Drop Overlay */}
        {isDragging && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file && file.name.endsWith(".pdf")) {
                setDraftedFile(file);
              }
            }}
            className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center border-2 border-dashed border-red-500 rounded-[20px] m-2 transition-all duration-300"
          >
            <span className="text-3xl mb-2">📥</span>
            <span className="text-xs font-sans text-neutral-200 font-medium">Drop PDF file here to attach</span>
            <span className="text-[9px] font-mono text-zinc-500 mt-1">Suku cadang / PR Document</span>
          </div>
        )}

        {/* Top Header Section */}
        <div className="p-4 flex justify-between items-center border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
              ToolCrib Copilot
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors p-1 rounded-full hover:bg-neutral-800 cursor-pointer"
            title="Close panel"
          >
            <svg
              xmlns="http://www.w3.org/2500/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Chat History Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col scrollbar-thin scrollbar-thumb-zinc-800">
          {messages.length === 0 ? (
            /* Welcome mockup layout if empty */
            <div className="my-auto flex flex-col justify-end items-start gap-6 pb-4">
              <div className="space-y-1">
                <div className="text-red-500 text-2xl font-bold font-sans tracking-wide leading-tight">
                  Hello, {displayName}
                </div>
                <div className="text-neutral-400 text-2xl font-medium font-sans tracking-wide leading-tight">
                  What can I help ?
                </div>
              </div>

              {/* Suggestions chips */}
              <div className="flex flex-col gap-2.5 w-full">
                <button
                  onClick={() => handleSendMessage("What we can do ?")}
                  className="w-fit text-left px-4 py-2 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/50 text-white text-[11px] font-sans font-medium rounded-full transition-colors cursor-pointer max-w-[240px]"
                >
                  What we can do ?
                </button>
                <button
                  onClick={() => handleSendMessage("What kind of question you can ask ?")}
                  className="w-fit text-left px-4 py-2 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/50 text-white text-[11px] font-sans font-medium rounded-full transition-colors cursor-pointer max-w-[260px]"
                >
                  What kind of question you can ask ?
                </button>
              </div>
            </div>
          ) : (
            /* Message Log */
            <div className="space-y-3 flex-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[85%] ${
                    msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl text-[11px] font-sans leading-relaxed break-words whitespace-pre-wrap ${
                      msg.sender === "user"
                        ? "bg-red-500 text-white rounded-tr-none"
                        : "bg-zinc-800 text-neutral-200 rounded-tl-none border border-zinc-700/50"
                    }`}
                  >
                    {renderMessageContent(msg.text)}
                  </div>
                  <span className="text-[8px] text-gray-500 font-mono mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Input Area */}
        <div className="p-4 border-t border-zinc-850 bg-neutral-900/50">
          <div className="w-full bg-neutral-950 rounded-[20px] border border-zinc-800 p-3 flex flex-col justify-between relative focus-within:border-zinc-700 transition-colors">
            
            {/* Draft Attachment Preview */}
            {draftedFile && (
              <div className="flex items-center justify-between bg-zinc-850/60 border border-zinc-800 rounded-xl px-3 py-1.5 mb-2 text-[10px] text-zinc-300">
                <div className="flex items-center gap-1.5">
                  <span className="text-red-400">📄</span>
                  <span className="truncate max-w-[180px] font-mono">{draftedFile.name}</span>
                </div>
                <button 
                  onClick={() => setDraftedFile(null)} 
                  className="text-neutral-500 hover:text-red-400 transition-colors ml-2 cursor-pointer font-bold"
                  title="Remove attachment"
                >
                  ✕
                </button>
              </div>
            )}

            <textarea
              placeholder="Type message here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-white text-xs placeholder-zinc-600 focus:outline-none resize-none h-12 leading-relaxed"
            />
            <div className="flex justify-between items-center mt-1">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setDraftedFile(file);
                  }
                  e.target.value = "";
                }}
              />
              
              {/* Paperclip upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-full transition-colors flex items-center justify-center cursor-pointer bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                title="Attach PDF file"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
              </button>

              <button
                onClick={() => handleSendMessage(inputText)}
                className={`p-1.5 rounded-full transition-colors flex items-center justify-center cursor-pointer ${
                  inputText.trim() || draftedFile ? "bg-red-500 text-white hover:bg-red-600" : "text-neutral-700"
                }`}
                disabled={!inputText.trim() && !draftedFile}
                title="Send message"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
