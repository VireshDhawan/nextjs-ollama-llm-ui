"use client";

import { set, z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";
import { ModeToggle } from "./mode-toggle";
import { toast } from "sonner"


const formSchema = z.object({
  username: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  systemMessage: z.string().min(5, {
    message: "System message must be at least 5 characters.",
  }),
  firstMessage: z.string().min(5, {
    message: "First message must be at least 5 characters.",
  }),
});

interface EditUsernameFormProps {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function EditUsernameForm({ setOpen }: EditUsernameFormProps) {
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [systemMessage, setSystemMessage] = useState("");
  const [firstMessage, setFirstMessage] = useState("");

  useEffect(() => {
    // Fetching values from localStorage
    const savedName = localStorage.getItem("ollama_user") || "Anonymous";
    const savedSystemMessage =
      localStorage.getItem("system_message") || "System: Chat initialized";
    const savedFirstMessage =
      localStorage.getItem("first_message") || "Hello, how can I assist you today?";

    // Setting the values in state
    setName(savedName);
    setSystemMessage(savedSystemMessage);
    setFirstMessage(savedFirstMessage);
    setLoading(false); // Ensure the form only renders after values are fetched
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: name,
      systemMessage: systemMessage,
      firstMessage: firstMessage,
    },
  });

  useEffect(() => {
    // Update form default values when localStorage values are set
    form.reset({
      username: name,
      systemMessage: systemMessage,
      firstMessage: firstMessage,
    });
  }, [name, systemMessage, firstMessage, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Save values to localStorage and notify the user
    localStorage.setItem("ollama_user", values.username);
    localStorage.setItem("system_message", values.systemMessage);
    localStorage.setItem("first_message", values.firstMessage);

    // Dispatch storage event so other components can react to changes
    window.dispatchEvent(new Event("storage"));

    toast.success("Settings updated successfully");
    setOpen(false);
  }

  // Don't render the form until the values from localStorage are loaded
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div
      aria-describedby="form-description" // Adding aria-describedby for accessibility
    >
      <Form {...form}>
       <div className="w-full flex flex-col gap-4 pt-8">
       <FormLabel>Theme</FormLabel>
        <ModeToggle />
       </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <p id="form-description" className="sr-only">
            Update your chat settings including username, system message, and first message.
          </p>

          {/* Username field */}
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter your name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* System message field */}
          <FormField
            control={form.control}
            name="systemMessage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>System Message</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter system message" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* First message field */}
          <FormField
            control={form.control}
            name="firstMessage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Message</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter first message" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit button */}
          <Button className="w-full" type="submit">
            Save Changes
          </Button>
        </form>
      </Form>
    </div>
  );
}
