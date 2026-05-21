"use client";

import { use, useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { toast } from "sonner";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  MeetingRequest,
  User as DbUser,
  Message,
} from "@/types/database";

type ConversationItem = Omit<MeetingRequest, "company"> & {
  company: DbUser | null;
  latestMessage?: Message | null;
};

export default function AdvisorChatPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = use(searchParams);
  const initialRequestId =
    typeof resolvedSearchParams.request_id === "string"
      ? resolvedSearchParams.request_id
      : undefined;

  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string>(
    initialRequestId ?? ""
  );
  const [inputValue, setInputValue] = useState("");
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, loading: messagesLoading, sendMessage } =
    useRealtimeMessages(selectedRequestId);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    setConversationsLoading(true);

    const { data } = await supabase
      .from("meeting_requests")
      .select("*, company:users!company_id(*)")
      .eq("advisor_id", user.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch latest message for each conversation
      const enriched = await Promise.all(
        (data as ConversationItem[]).map(async (conv) => {
          const { data: latestMsgs } = await supabase
            .from("messages")
            .select("*")
            .eq("request_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1);

          return {
            ...conv,
            latestMessage: latestMsgs?.[0] as Message | undefined ?? null,
          };
        })
      );

      setConversations(enriched);

      // Auto-select first if no initial request_id
      if (!selectedRequestId && enriched.length > 0) {
        setSelectedRequestId(enriched[0].id);
      }
    }

    setConversationsLoading(false);
  }, [user, supabase, selectedRequestId]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchConversations();
    }
  }, [authLoading, user, fetchConversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!user || !inputValue.trim() || !selectedRequestId || sending) return;

    setSending(true);
    const { error } = await sendMessage(inputValue.trim(), user.id);

    if (error) {
      toast.error("メッセージの送信に失敗しました");
    } else {
      setInputValue("");
    }
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  function formatMessageDate(dateStr: string): string {
    const d = new Date(dateStr);
    const today = new Date();
    const isToday =
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();

    if (isToday) return "今日";
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  }

  // Group messages by date
  function groupMessagesByDate(msgs: Message[]): { date: string; messages: Message[] }[] {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";

    for (const msg of msgs) {
      const msgDate = formatMessageDate(msg.created_at);
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    }
    return groups;
  }

  const selectedConversation = conversations.find(
    (c) => c.id === selectedRequestId
  );

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#0F569D]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[#6B7280]">ログインしてください</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Left Pane - Conversation List */}
      <div className="hidden w-80 shrink-0 border-r border-[#E5E7EB] bg-white md:block">
        <div className="border-b border-[#E5E7EB] px-4 py-3">
          <h2 className="font-heading text-sm font-bold text-[#1A1A2E]">
            メッセージ
          </h2>
        </div>
        <ScrollArea className="h-[calc(100vh-64px-49px)]">
          {conversationsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-[#0F569D]" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-[#6B7280]">
                承認済みの会話はありません
              </p>
            </div>
          ) : (
            <div>
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setSelectedRequestId(conv.id)}
                  className={cn(
                    "w-full border-b border-[#E5E7EB] px-4 py-3 text-left transition-colors hover:bg-[#F8F9FB]",
                    selectedRequestId === conv.id &&
                      "border-l-2 border-l-[#0F569D] bg-[#E8F0FE]"
                  )}
                >
                  <p className="text-sm font-medium text-[#1A1A2E] truncate">
                    {conv.company?.display_name ?? "企業名不明"}
                  </p>
                  {conv.latestMessage ? (
                    <p className="mt-1 truncate text-xs text-[#6B7280]">
                      {conv.latestMessage.content}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-[#6B7280]">
                      メッセージなし
                    </p>
                  )}
                  <p className="mt-1 text-xs text-[#6B7280]">
                    {conv.latestMessage
                      ? `${formatDate(conv.latestMessage.created_at)} ${formatTime(conv.latestMessage.created_at)}`
                      : formatDate(conv.created_at)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Mobile conversation selector */}
      <div className="block w-full md:hidden">
        {!selectedRequestId ? (
          <div className="h-full">
            <div className="border-b border-[#E5E7EB] px-4 py-3">
              <h2 className="font-heading text-sm font-bold text-[#1A1A2E]">
                メッセージ
              </h2>
            </div>
            <ScrollArea className="h-[calc(100vh-64px-49px)]">
              {conversationsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-6 animate-spin text-[#0F569D]" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <p className="text-sm text-[#6B7280]">
                    承認済みの会話はありません
                  </p>
                </div>
              ) : (
                <div>
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => setSelectedRequestId(conv.id)}
                      className="w-full border-b border-[#E5E7EB] px-4 py-3 text-left transition-colors hover:bg-[#F8F9FB]"
                    >
                      <p className="text-sm font-medium text-[#1A1A2E] truncate">
                        {conv.company?.display_name ?? "企業名不明"}
                      </p>
                      {conv.latestMessage ? (
                        <p className="mt-1 truncate text-xs text-[#6B7280]">
                          {conv.latestMessage.content}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-[#6B7280]">
                          メッセージなし
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          <MobileChatView
            user={user}
            selectedConversation={selectedConversation ?? null}
            messages={messages}
            messagesLoading={messagesLoading}
            inputValue={inputValue}
            setInputValue={setInputValue}
            sending={sending}
            handleSend={handleSend}
            handleKeyDown={handleKeyDown}
            formatTime={formatTime}
            groupMessagesByDate={groupMessagesByDate}
            messagesEndRef={messagesEndRef}
            onBack={() => setSelectedRequestId("")}
          />
        )}
      </div>

      {/* Right Pane - Messages (Desktop) */}
      <div className="hidden flex-1 flex-col md:flex">
        {!selectedRequestId ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <MessageSquare className="mx-auto size-12 text-[#E5E7EB]" />
              <p className="mt-4 text-sm text-[#6B7280]">
                会話を選択してください
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="shrink-0 border-b border-[#E5E7EB] bg-white px-6 py-3">
              <p className="text-sm font-bold text-[#1A1A2E]">
                {selectedConversation?.company?.display_name ??
                  "企業名不明"}
              </p>
              {selectedConversation?.consultation_content && (
                <p className="mt-0.5 truncate text-xs text-[#6B7280]">
                  {selectedConversation.consultation_content}
                </p>
              )}
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 bg-[#F8F9FB]">
              <div className="px-6 py-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 animate-spin text-[#0F569D]" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-sm text-[#6B7280]">
                      メッセージはまだありません。最初のメッセージを送信しましょう。
                    </p>
                  </div>
                ) : (
                  groupMessagesByDate(messages).map((group) => (
                    <div key={group.date}>
                      <div className="my-4 flex items-center justify-center">
                        <span className="rounded-full bg-[#E5E7EB] px-3 py-1 text-xs text-[#6B7280]">
                          {group.date}
                        </span>
                      </div>
                      {group.messages.map((msg) => {
                        const isOwn = msg.sender_id === user.id;
                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              "mb-3 flex",
                              isOwn ? "justify-end" : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[70%] break-words px-4 py-2",
                                isOwn
                                  ? "rounded-2xl rounded-br-sm bg-[#0F569D] text-white"
                                  : "rounded-2xl rounded-bl-sm bg-[#F8F9FB] text-[#1A1A2E] ring-1 ring-[#E5E7EB]"
                              )}
                            >
                              <p className="text-sm whitespace-pre-wrap">
                                {msg.content}
                              </p>
                              <p
                                className={cn(
                                  "mt-1 text-xs",
                                  isOwn
                                    ? "text-white/70"
                                    : "text-[#6B7280]"
                                )}
                              >
                                {formatTime(msg.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="shrink-0 border-t border-[#E5E7EB] bg-white px-6 py-3">
              <div className="flex items-center gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="メッセージを入力..."
                  className="flex-1"
                  disabled={sending}
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || sending}
                  className="bg-[#0F569D] text-white hover:bg-[#0A3D6E]"
                  size="icon"
                >
                  {sending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* Mobile chat view component */
function MobileChatView({
  user,
  selectedConversation,
  messages,
  messagesLoading,
  inputValue,
  setInputValue,
  sending,
  handleSend,
  handleKeyDown,
  formatTime,
  groupMessagesByDate,
  messagesEndRef,
  onBack,
}: {
  user: DbUser;
  selectedConversation: ConversationItem | null;
  messages: Message[];
  messagesLoading: boolean;
  inputValue: string;
  setInputValue: (v: string) => void;
  sending: boolean;
  handleSend: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  formatTime: (dateStr: string) => string;
  groupMessagesByDate: (msgs: Message[]) => { date: string; messages: Message[] }[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onBack: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-[#E5E7EB] bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-[#0F569D]"
          >
            ← 戻る
          </button>
          <p className="text-sm font-bold text-[#1A1A2E]">
            {selectedConversation?.company?.display_name ?? "企業名不明"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 bg-[#F8F9FB]">
        <div className="px-4 py-4">
          {messagesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-[#0F569D]" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-[#6B7280]">
                メッセージはまだありません
              </p>
            </div>
          ) : (
            groupMessagesByDate(messages).map((group) => (
              <div key={group.date}>
                <div className="my-4 flex items-center justify-center">
                  <span className="rounded-full bg-[#E5E7EB] px-3 py-1 text-xs text-[#6B7280]">
                    {group.date}
                  </span>
                </div>
                {group.messages.map((msg) => {
                  const isOwn = msg.sender_id === user.id;
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "mb-3 flex",
                        isOwn ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] break-words px-4 py-2",
                          isOwn
                            ? "rounded-2xl rounded-br-sm bg-[#0F569D] text-white"
                            : "rounded-2xl rounded-bl-sm bg-[#F8F9FB] text-[#1A1A2E] ring-1 ring-[#E5E7EB]"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {msg.content}
                        </p>
                        <p
                          className={cn(
                            "mt-1 text-xs",
                            isOwn ? "text-white/70" : "text-[#6B7280]"
                          )}
                        >
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="shrink-0 border-t border-[#E5E7EB] bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力..."
            className="flex-1"
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || sending}
            className="bg-[#0F569D] text-white hover:bg-[#0A3D6E]"
            size="icon"
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
