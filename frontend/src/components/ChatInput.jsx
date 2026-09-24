import {
  Code2,
  FileText,
  Globe,
  ImageIcon,
  MessageSquare,
  Mic,
  Paperclip,
  Presentation,
  Send,
  Zap,
} from "lucide-react";

import React, { useEffect, useRef, useState } from "react";

import sendMessage from "../features/sendMessage";

import { useDispatch, useSelector } from "react-redux";

import {
  addMessage,
  setArtifacts,
  setLoading,
} from "../redux/messageSlice";

import { updateConversation } from "../features/updateConversation";

import { setConvTitle } from "../redux/conversationSlice";

import { setCredits } from "../redux/userSlice";

function ChatInput() {
  const [value, setValue] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("Auto");

  const [selectedFile, setSelectedFile] = useState(null);

  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const sendingRef = useRef(false);
  const fileRef = useRef(null);

  const dispatch = useDispatch();

  const { selectedConversation } = useSelector(
    (state) => state.conversation
  );

  const { loading } = useSelector(
    (state) => state.message
  );

  // ============================================================
  // SPEECH RECOGNITION (setup once, start/stop from mic button)
  // ============================================================

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.log("🎤 Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      setValue((prev) => (prev + " " + transcript).trimStart());
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = (e) => {
      console.error("🎤 Speech error:", e.error);
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    };
  }, []);

  // ============================================================
  // MIC TOGGLE
  // ============================================================

  const toggleListening = () => {
    const recognition = recognitionRef.current;

    if (!recognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    if (loading) {
      return;
    }

    if (listening) {
      recognition.stop();
      setListening(false);
    } else {
      try {
        recognition.start();
        setListening(true);
      } catch (error) {
        console.error("🎤 Could not start recognition:", error);
      }
    }
  };

  // ============================================================
  // FILE SELECT
  // ============================================================

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    console.log("📁 FILE SELECTED:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    const isPdf = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");

    if (!isPdf && !isImage) {
      alert("Only PDF and image files are allowed.");
      e.target.value = "";
      return;
    }

    const maxSize = 20 * 1024 * 1024;

    if (file.size > maxSize) {
      alert("File size must be less than 20 MB.");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);

    console.log("✅ FILE STORED:", file.name);
  };

  // ============================================================
  // OPEN FILE PICKER
  // ============================================================

  const handlePaperclipClick = () => {
    console.log("📎 PAPERCLIP CLICKED");

    if (loading) {
      return;
    }

    fileRef.current?.click();
  };

  // ============================================================
  // REMOVE FILE
  // ============================================================

  const handleRemoveFile = () => {
    console.log("🗑️ REMOVING FILE");

    setSelectedFile(null);

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  // ============================================================
  // SEND MESSAGE
  // ============================================================

  const handleSendMessage = async (e) => {
    e.preventDefault();

    console.log("🚀 SEND BUTTON CLICKED");

    // Stop mic if it is running
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    }

    if (sendingRef.current) {
      console.log("⚠️ Request already running. Ignoring duplicate send.");
      return;
    }

    if (!value.trim() && !selectedFile) {
      console.log("⚠️ Empty message and no file.");
      return;
    }

    if (!selectedConversation?._id) {
      console.log("❌ No conversation selected.");
      return;
    }

    const prompt = value.trim();

    sendingRef.current = true;
    dispatch(setLoading(true));

    try {
      // ---------- UPDATE CONVERSATION TITLE ----------

      if (selectedConversation?.title === "New Chat" && prompt) {
        try {
          await updateConversation({
            id: selectedConversation._id,
            title: prompt,
          });

          dispatch(
            setConvTitle({
              conversationId: selectedConversation._id,
              title: prompt.slice(0, 40),
            })
          );
        } catch (error) {
          console.error("❌ Error updating conversation title:", error);
        }
      }

      // ---------- CREATE FORMDATA ----------

      const formData = new FormData();

      formData.append("prompt", prompt);
      formData.append("conversationId", selectedConversation._id);
      formData.append("agent", selectedAgent.toLowerCase());

      if (selectedFile) {
        formData.append("file", selectedFile);

        console.log("📎 FILE ADDED TO FORMDATA:", {
          name: selectedFile.name,
          type: selectedFile.type,
          size: selectedFile.size,
        });
      }

      console.log("📦 FORMDATA CONTENT:");

      for (const [key, val] of formData.entries()) {
        if (val instanceof File) {
          console.log(key, { name: val.name, type: val.type, size: val.size });
        } else {
          console.log(key, val);
        }
      }

      // ---------- ADD USER MESSAGE TO REDUX ----------

      dispatch(
        addMessage({
          _id: `user-${Date.now()}`,
          role: "user",
          content: prompt || `📎 ${selectedFile?.name}`,
          images: [],
        })
      );

      setValue("");

      // ---------- SEND TO BACKEND ----------

      console.log("📡 CALLING BACKEND...");

      const data = await sendMessage(formData);

      console.log("🔥 BACKEND RESPONSE:", data);

      if (typeof data?.credits === "number") {
        dispatch(setCredits(data.credits));
      }

      // ---------- ARTIFACTS ----------

      const artifacts =
        typeof data === "string" ? [] : data?.artifacts || [];

      dispatch(setArtifacts(artifacts));

      // ---------- AI RESPONSE ----------

      const aiContent =
        typeof data === "string"
          ? data
          : data?.answer || data?.message || "No response received.";

      // ---------- IMAGES ----------

      const rawImages =
        typeof data === "string"
          ? []
          : Array.isArray(data?.images)
            ? data.images
            : data?.image
              ? [data.image]
              : [];

      const uniqueImages = [
        ...new Set(
          rawImages.filter((img) => typeof img === "string" && img.trim())
        ),
      ];

      const aiImages = uniqueImages.slice(0, 1);

      console.log("🖼️ AI IMAGES:", aiImages);

      // ---------- ADD AI MESSAGE ----------

      dispatch(
        addMessage({
          _id: `assistant-${Date.now()}`,
          role: "assistant",
          content: aiContent,
          images: aiImages,
          artifacts,
        })
      );

      // ---------- CLEAR SELECTED FILE ----------

      setSelectedFile(null);

      if (fileRef.current) {
        fileRef.current.value = "";
      }

      console.log("✅ MESSAGE SENT SUCCESSFULLY");
    } catch (error) {
      console.error(
        "❌ ERROR SENDING MESSAGE:",
        error?.response?.data || error?.message || error
      );

      // Show why it failed (no credits, rate limit, ...) instead of silence.
      const errData = error?.response?.data;

      if (typeof errData?.credits === "number") {
        dispatch(setCredits(errData.credits));
      }

      dispatch(
        addMessage({
          _id: `error-${Date.now()}`,
          role: "assistant",
          content: `⚠️ ${errData?.message || "Something went wrong. Please try again."}`,
          images: [],
        })
      );
    } finally {
      sendingRef.current = false;
      dispatch(setLoading(false));

      console.log("🔓 SEND LOCK RELEASED");
    }
  };

  // ============================================================
  // AGENTS
  // ============================================================

  const agents = [
    { id: "auto", icon: Zap, label: "Auto" },
    { id: "chat", icon: MessageSquare, label: "chat" },
    { id: "coding", icon: Code2, label: "coding" },
    { id: "pdf", icon: FileText, label: "PDF" },
    { id: "ppt", icon: Presentation, label: "PPT" },
    { id: "vision", icon: ImageIcon, label: "Vision" },
    { id: "search", icon: Globe, label: "search" },
  ];

  // ============================================================
  // UI
  // ============================================================

  return (
    <div
      className="
        w-full
        overflow-hidden
        px-3
        md:px-5
        py-4
        border-t
        border-white/[0.06]
        bg-[#0d0f14]
      "
    >
      <form
        onSubmit={handleSendMessage}
        className="
          flex
          flex-col
          gap-2
          bg-white/[0.03]
          border
          border-white/[0.07]
          rounded-2xl
          px-4
          pt-3.5
          pb-3
        "
      >
        {/* ================= AGENT BUTTONS ================= */}

        <div className="flex w-[80%] gap-2 pr-2 flex-wrap">
          {agents.map((agent) => {
            const isActive = selectedAgent === agent.label;
            const Icon = agent.icon;

            return (
              <button
                type="button"
                key={agent.id}
                onClick={() => setSelectedAgent(agent.label)}
                disabled={loading}
                className={`
                  flex-shrink-0
                  cursor-pointer
                  inline-flex
                  items-center
                  gap-1.5
                  px-3
                  py-2
                  rounded-full
                  text-xs
                  font-medium
                  border
                  transition-all

                  ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-transparent shadow-[0_1px_8px_rgba(99,102,241,.35)]"
                      : "bg-white/[0.03] text-slate-400 border-white/[0.06] hover:bg-white/[0.07]"
                  }

                  disabled:opacity-50
                  disabled:cursor-not-allowed
                `}
              >
                <Icon
                  size={14}
                  className={isActive ? "text-white" : "text-slate-500"}
                />

                {agent.label}
              </button>
            );
          })}
        </div>

        {/* ================= SELECTED FILE PREVIEW ================= */}

        {selectedFile && (
          <div
            className="
              flex
              items-center
              justify-between
              gap-3
              px-3
              py-2
              rounded-xl
              bg-white/[0.04]
              border
              border-white/[0.08]
            "
          >
            <div className="flex items-center gap-2 min-w-0">
              {selectedFile.type.startsWith("image/") ? (
                <ImageIcon size={18} className="text-indigo-400 flex-shrink-0" />
              ) : (
                <FileText size={18} className="text-red-400 flex-shrink-0" />
              )}

              <div className="min-w-0">
                <p className="text-xs text-slate-200 truncate">
                  {selectedFile.name}
                </p>

                <p className="text-[10px] text-slate-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemoveFile}
              disabled={loading}
              className="
                flex
                items-center
                justify-center
                w-6
                h-6
                rounded-full
                text-slate-500
                hover:text-red-400
                hover:bg-white/[0.05]
                cursor-pointer
                disabled:opacity-50
              "
            >
              ×
            </button>
          </div>
        )}

        {/* ================= TEXTAREA ================= */}

        <textarea
          placeholder={listening ? "Listening..." : "Ask Anything..."}
          onChange={(e) => setValue(e.target.value)}
          value={value}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
          className="
            w-full
            bg-transparent
            outline-none
            resize-none
            text-[14px]
            text-slate-200
            placeholder:text-slate-600
            leading-relaxed
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
            disabled:opacity-50
          "
          rows={2}
        />

        {/* ================= BOTTOM ================= */}

        <div className="flex items-center justify-between">
          {/* LEFT */}

          <div className="flex items-center gap-1">
            {/* FILE INPUT */}

            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            {/* PAPERCLIP */}

            <button
              type="button"
              onClick={handlePaperclipClick}
              disabled={loading}
              title="Attach PDF or image"
              className="
                flex
                items-center
                justify-center
                w-8
                h-8
                rounded-lg
                text-slate-600
                hover:text-slate-400
                hover:bg-white/[0.05]
                border
                border-transparent
                hover:border-white/[0.06]
                transition-all
                duration-150
                bg-transparent
                cursor-pointer
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              <Paperclip size={16} />
            </button>

            {/* MICROPHONE */}

            <button
              type="button"
              onClick={toggleListening}
              disabled={loading}
              title={listening ? "Stop listening" : "Start voice input"}
              className={`
                flex
                items-center
                justify-center
                w-8
                h-8
                rounded-lg
                hover:bg-white/[0.05]
                border
                border-transparent
                hover:border-white/[0.06]
                transition-all
                duration-150
                bg-transparent
                cursor-pointer
                disabled:opacity-50

                ${
                  listening
                    ? "text-red-400 animate-pulse"
                    : "text-slate-600 hover:text-slate-400"
                }
              `}
            >
              <Mic size={16} />
            </button>
          </div>

          {/* SEND BUTTON */}

          <button
            type="submit"
            disabled={
              loading ||
              (!value.trim() && !selectedFile) ||
              !selectedConversation?._id
            }
            className={`
              flex
              items-center
              justify-center
              w-8
              h-8
              rounded-lg
              border-none
              transition-all
              duration-150

              ${
                loading
                  ? "bg-white/[0.05] text-slate-600 cursor-not-allowed"
                  : (value.trim() || selectedFile) && selectedConversation?._id
                    ? "bg-gradient-to-br from-indigo-500 to-violet-700 hover:opacity-90 text-white cursor-pointer"
                    : "bg-white/[0.05] text-slate-600 cursor-not-allowed"
              }
            `}
          >
            <Send size={15} />
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatInput;


