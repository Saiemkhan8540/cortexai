import React from "react";
import { useSelector } from "react-redux";
import MessageBubble from "./MessageBubble";
import LoadingAnimation from "./LoadingAnimation";

function MessageList() {
  const { selectedConversation } = useSelector(
    (state) => state.conversation
  );

  const { messages, loading } = useSelector(
    (state) => state.message
  );

  console.log("🔥 MessageList messages:", messages);
  console.log("⏳ MessageList loading:", loading);

  return (
    <div
      className="
        flex-1
        min-h-0
        overflow-y-auto
        overflow-x-hidden
        px-6
        py-6
      "
    >
      <div className="max-w-4xl mx-auto h-full">

        {!selectedConversation || messages.length === 0 ? (
  <div className="h-full flex flex-col items-center justify-center text-center px-4">
    <h1 className="text-2xl font-semibold text-slate-200">
      CortexAI
    </h1>

    <h2 className="text-lg font-medium text-slate-400">
      How can I help you?
    </h2>

    <p className="text-sm text-slate-600">
      Ask me anything - code, ideas, explanations,
      or just a quick question.
    </p>
  </div>
) : (
  <div className="flex flex-col gap-8 pb-6">

    {messages.map((message, index) => (
      <MessageBubble
        key={
          message._id ||
          `${message.role}-${index}`
        }
        role={message.role}
        content={message.content}
        images={message.images || []}
      />
    ))}

    {loading && <LoadingAnimation />}

  </div>
)}

      </div>
    </div>
  );
}

export default MessageList;