"use client";

import { ChatLayout } from "@/components/chat/chat-layout";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogContent,
} from "@/components/ui/dialog";
import UsernameForm from "@/components/username-form";
import { Message, useChat } from "ai/react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import useChatStore from "./hooks/useChatStore";

const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

export default function Home() {
  const {
    messages,
    input,
    handleInputChange,
    isLoading,
    error,
    setMessages,
    setInput,
  } = useChat();
  
  const [chatId, setChatId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const base64Images = useChatStore((state) => state.base64Images);
  const setBase64Images = useChatStore((state) => state.setBase64Images);

  useEffect(() => {
    if (messages.length < 1) {
      const id = uuidv4();
      setChatId(id);

      const systemMessageText =
        localStorage.getItem("system_message") ||
        process.env.NEXT_PUBLIC_SYSTEM_MESSAGE ||
        "System: Chat initialized";

      const firstMessageText =
        localStorage.getItem("first_message") ||
        process.env.NEXT_PUBLIC_FIRST_MESSAGE ||
        "Hello, how can I assist you today?";

      const initialMessages = [
        { id: uuidv4(), role: "system", content: systemMessageText },
        { id: uuidv4(), role: "assistant", content: firstMessageText },
      ];

      setMessages(() => [...initialMessages]);
    }
  }, [messages]);

  useEffect(() => {
    if (!isLoading && !error && chatId && messages.length > 0) {
      localStorage.setItem(`chat_${chatId}`, JSON.stringify(messages));
      window.dispatchEvent(new Event("storage"));
    }
    setLoadingSubmit(false);
  }, [chatId, isLoading, error, messages]);

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
    window.dispatchEvent(new Event("storage"));
  };

  const handleAPICall = async (userMessage: string) => {
    try {
      // Prepare all messages to send, including historical messages
      const allMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Add the new user message
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
      setMessages((prev) => [...prev]); // Ensure state is updated
      localStorage.setItem(`chat_${chatId}`, JSON.stringify(messages));
      window.dispatchEvent(new Event("storage"));
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      setLoadingSubmit(false);
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingSubmit(true);

    if (!input) return;

    addMessage({ role: "user", content: input, id: chatId });
    setInput("");

    handleAPICall(input);
    setBase64Images(null);
  };

  
  const onOpenChange = (isOpen: boolean) => { 
    const username = localStorage.getItem("ollama_user")
    if (username) return setOpen(isOpen)

    localStorage.setItem("ollama_user", "Anonymous")
    window.dispatchEvent(new Event("storage"))
    setOpen(isOpen)
  }

  return (
    <main className="flex h-[calc(100dvh)] flex-col items-center ">
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ChatLayout
        chatId=""
        setSelectedModel={process.env.NEXT_PUBLIC_SELECTED_MODEL }
        messages={messages}
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={onSubmit}
        isLoading={isLoading}
        loadingSubmit={loadingSubmit}
        error={error}
        // stop={stop}
        navCollapsedSize={10}
        defaultLayout={[30, 160]}
        formRef={formRef}
        setMessages={setMessages}
        setInput={setInput}
      />
      <DialogContent className="flex flex-col space-y-4">
        <DialogHeader className="space-y-2">
          <DialogTitle>Welcome to Ollama!</DialogTitle>
          <DialogDescription>
            Enter your name to get started. This is just to personalize your
            experience.
          </DialogDescription>
          <UsernameForm setOpen={setOpen} />
        </DialogHeader>
      </DialogContent>
    </Dialog>
  </main>
  );
}