import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/local/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface ChatContact {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  last_message?: string;
  last_time?: string;
  unread?: number;
}

const Chat = () => {
  const { user, role, profile } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [selectedContact, setSelectedContact] = useState<string | null>(searchParams.get("with"));
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch contacts (users we've chatted with)
  const { data: contacts = [] } = useQuery({
    queryKey: ["chat-contacts", user?.id, role],
    queryFn: async () => {
      if (!user) return [];
      const { data: messages } = await supabase
        .from("chat_messages")
        .select("sender_id, receiver_id, message, created_at")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!messages) return [];

      const contactIds = new Set<string>();
      const contactMap: Record<string, { last_message: string; last_time: string }> = {};

      for (const msg of messages) {
        const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!contactIds.has(otherId)) {
          contactIds.add(otherId);
          contactMap[otherId] = { last_message: msg.message, last_time: msg.created_at };
        }
      }

      // Add the "with" param contact if not in list
      const withId = searchParams.get("with");
      if (withId && !contactIds.has(withId)) {
        contactIds.add(withId);
        contactMap[withId] = { last_message: "", last_time: "" };
      }

      if (contactIds.size === 0) {
        const [{ data: allProfiles }, { data: allRoles }] = await Promise.all([
          supabase.from("profiles").select("user_id, full_name, avatar_url"),
          supabase.from("user_roles").select("user_id, role"),
        ]);

        const rolesMap = new Map((allRoles || []).map((r: any) => [r.user_id, r.role]));
        let candidates = (allProfiles || []).filter((p: any) => p.user_id !== user.id);

        if (role === "student") {
          candidates = candidates.filter((p: any) => rolesMap.get(p.user_id) === "tutor");
        } else if (role === "tutor") {
          candidates = candidates.filter((p: any) => rolesMap.get(p.user_id) !== "tutor");
        }

        return candidates.map((p: any) => ({
          ...p,
          last_message: "",
          last_time: "",
        })) as ChatContact[];
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", Array.from(contactIds));

      return (profiles || []).map((p) => ({
        ...p,
        last_message: contactMap[p.user_id]?.last_message || "",
        last_time: contactMap[p.user_id]?.last_time || "",
      })) as ChatContact[];
    },
    enabled: !!user,
  });

  // Fetch messages for selected contact
  const { data: messages = [] } = useQuery({
    queryKey: ["chat-messages", user?.id, selectedContact],
    queryFn: async () => {
      if (!user || !selectedContact) return [];
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${selectedContact}),and(sender_id.eq.${selectedContact},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!user && !!selectedContact,
    refetchInterval: 3000, // Poll every 3s for real-time feel
  });

  // Subscribe to real-time messages
  useEffect(() => {
    if (!user || !selectedContact) return;
    const channel = supabase
      .channel(`chat-${user.id}-${selectedContact}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chat-messages", user.id, selectedContact] });
          queryClient.invalidateQueries({ queryKey: ["chat-contacts", user.id] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, selectedContact, queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (!user || !selectedContact) return;
    Promise.all([
      supabase
        .from("chat_messages")
        .update({ read: true })
        .eq("sender_id", selectedContact)
        .eq("receiver_id", user.id)
        .eq("read", false),
      supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("type", "message")
        .eq("read", false),
    ]).then(() => {});
  }, [user, selectedContact, messages]);

  const handleSend = async () => {
    if (!user || !selectedContact || !message.trim()) return;
    setSending(true);
    try {
      const cleanMessage = message.trim();
      const { error } = await supabase.from("chat_messages").insert({
        sender_id: user.id,
        receiver_id: selectedContact,
        message: cleanMessage,
      });
      if (error) throw error;

      const senderName = profile?.full_name || user.user_metadata?.full_name || "New message";
      await supabase.from("notifications").insert({
        user_id: selectedContact,
        type: "message",
        title: "New Message",
        message: `${senderName}: ${cleanMessage}`,
        read: false,
      });

      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["chat-messages", user.id, selectedContact] });
      queryClient.invalidateQueries({ queryKey: ["chat-contacts", user.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch {
      // silently fail
    } finally {
      setSending(false);
    }
  };

  const selectedContactInfo = contacts.find((c) => c.user_id === selectedContact);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Please log in to access chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-4">
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden" style={{ height: "calc(100vh - 120px)" }}>
          <div className="grid h-full md:grid-cols-[300px_1fr]">
            {/* Contacts */}
            <div className={`border-r border-border ${selectedContact ? "hidden md:block" : ""}`}>
              <div className="p-4 border-b border-border">
                <h2 className="font-heading font-semibold text-card-foreground">Messages</h2>
              </div>
              <ScrollArea className="h-[calc(100%-60px)]">
                {contacts.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">No conversations yet. Message a tutor to get started!</p>
                ) : (
                  contacts.map((contact) => (
                    <button
                      key={contact.user_id}
                      onClick={() => setSelectedContact(contact.user_id)}
                      className={`w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50 ${
                        selectedContact === contact.user_id ? "bg-primary/5" : ""
                      }`}
                    >
                      <img
                        src={contact.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.full_name)}&background=2a9d8f&color=fff`}
                        alt={contact.full_name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-card-foreground text-sm truncate">{contact.full_name}</div>
                        <div className="text-xs text-muted-foreground truncate">{contact.last_message}</div>
                      </div>
                    </button>
                  ))
                )}
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className={`flex flex-col ${!selectedContact ? "hidden md:flex" : ""}`}>
              {selectedContact ? (
                <>
                  {/* Header */}
                  <div className="flex items-center gap-3 p-4 border-b border-border">
                    <button onClick={() => setSelectedContact(null)} className="md:hidden text-muted-foreground">
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    {selectedContactInfo && (
                      <>
                        <img
                          src={selectedContactInfo.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedContactInfo.full_name)}&background=2a9d8f&color=fff`}
                          alt={selectedContactInfo.full_name}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                        <span className="font-medium text-card-foreground">{selectedContactInfo.full_name}</span>
                      </>
                    )}
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {messages.map((msg) => {
                        const isMe = msg.sender_id === user.id;
                        return (
                          <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                                isMe
                                  ? "bg-primary text-primary-foreground rounded-br-md"
                                  : "bg-muted text-foreground rounded-bl-md"
                              }`}
                            >
                              <p>{msg.message}</p>
                              <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                                {format(new Date(msg.created_at), "h:mm a")}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <div className="p-4 border-t border-border">
                    <div className="flex gap-2">
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                      />
                      <Button variant="hero" size="icon" onClick={handleSend} disabled={sending || !message.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-muted-foreground">Select a conversation to start chatting</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
