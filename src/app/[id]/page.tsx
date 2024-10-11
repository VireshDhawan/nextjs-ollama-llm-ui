"use client";

import { ChatLayout } from "@/components/chat/chat-layout";
import { Message, useChat } from "ai/react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import useChatStore from "../hooks/useChatStore";

const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

export default function Page({ params }: { params: { id: string } }) {
  const {
    messages,
    input,
    handleInputChange,
    isLoading,
    error,
    setMessages,
    setInput,
  } = useChat();
  
  const [chatId, setChatId] = React.useState<string>("");
  const formRef = React.useRef<HTMLFormElement>(null);
  const base64Images = useChatStore((state) => state.base64Images);
  const setBase64Images = useChatStore((state) => state.setBase64Images);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  useEffect(() => {
    if (params.id) {
      const item = `localStorage.getItem(chat_${params.id})`;
      if (item) {
        setMessages(JSON.parse(item));
      }
    }
  }, [params.id]);

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
    window.dispatchEvent(new Event("storage"));
  };

  const handleAPICall = async (userMessage: string) => {
    try {
      const allMessages = messages
        .filter((msg) => !msg.content.startsWith("data:image/"))
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      // Add the user's latest message to the conversation
      allMessages.push({ role: "user", content: userMessage });

      const response = await fetch(process.env.NEXT_PUBLIC_API_URL+'/api/v1/chat/completions', {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.NEXT_PUBLIC_SELECTED_MODEL,
          messages: allMessages,
        }),
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      const assistantMessage = data?.choices[0]?.message?.content || "No response";

      addMessage({ role: "assistant", content: assistantMessage, id: chatId });
      localStorage.setItem(`chat_${params.id}`, JSON.stringify(messages));
      window.dispatchEvent(new Event("storage"));
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input) return;

    addMessage({ role: "user", content: input, id: chatId });
    setInput("");

    handleAPICall(input);
    setBase64Images(null);
  };

  useEffect(() => {
    if (!isLoading && !error && messages.length > 0) {
      localStorage.setItem(`chat_${params.id}`, JSON.stringify(messages));
      window.dispatchEvent(new Event("storage"));
      setLoadingSubmit(false);
    }
  }, [messages, params.id, isLoading, error]);

  return (
    <main className="flex h-[calc(100dvh)] flex-col items-center">
      <ChatLayout
        chatId=""
        setSelectedModel={() => {}}
        messages={messages}
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={onSubmit}
        isLoading={isLoading}
        loadingSubmit={loadingSubmit}
        error={error}
        stop={stop}
        navCollapsedSize={10}
        defaultLayout={[30, 160]}
        formRef={formRef}
        setMessages={setMessages}
        setInput={setInput}
      />
    </main>
  );
}