"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/types/database";

export function useRealtimeMessages(requestId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchMessages() {
      const { data } = await supabase
        .from("messages")
        .select("*, sender:users!sender_id(*)")
        .eq("request_id", requestId)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(data as Message[]);
      }
      setLoading(false);
    }

    fetchMessages();

    const channel = supabase
      .channel(`messages:${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `request_id=eq.${requestId}`,
        },
        async (payload) => {
          const { data: newMessage } = await supabase
            .from("messages")
            .select("*, sender:users!sender_id(*)")
            .eq("id", payload.new.id)
            .single();

          if (newMessage) {
            setMessages((prev) => [...prev, newMessage as Message]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, supabase]);

  const sendMessage = useCallback(
    async (content: string, senderId: string) => {
      const { error } = await supabase.from("messages").insert({
        request_id: requestId,
        sender_id: senderId,
        content,
      });
      return { error };
    },
    [requestId, supabase]
  );

  return { messages, loading, sendMessage };
}
