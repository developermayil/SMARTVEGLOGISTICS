"use client";
import { useState, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  IconButton,
  Typography,
  TextField,
  Avatar,
  Chip,
  Drawer,
  Tooltip,
  alpha,
  Badge,
  Zoom,
  Fab,
  useTheme,
  Divider,
  Stack,
  LinearProgress,
  Button,
} from "@mui/material";
import {
  Close,
  Send,
  SmartToy,
  Mic,
  MicOff,
  DeleteSweep,
  History,
  Lightbulb,
  TrendingUp,
  Inventory2,
  LocalShipping,
  People,
  AttachMoney,
  Dashboard,
  SupportAgent,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Cookies from "js-cookie";

// Types
interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  suggestions?: string[];
  quickActions?: QuickAction[];
}

interface QuickAction {
  label: string;
  command: string;
  icon?: string;
  color?: string;
}

// Quick Actions with project colors
const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Today's Orders",
    icon: "📋",
    command: "Show today's orders",
    color: "#2E7D32",
  },
  {
    label: "Current Stock",
    icon: "📦",
    command: "Show current stock",
    color: "#FF6F00",
  },
  {
    label: "Pending Deliveries",
    icon: "🚚",
    command: "Pending deliveries",
    color: "#039BE5",
  },
  {
    label: "Today's Revenue",
    icon: "💰",
    command: "Today's revenue",
    color: "#43A047",
  },
  {
    label: "Low Stock Alert",
    icon: "⚠️",
    command: "Which item is low?",
    color: "#E53935",
  },
  {
    label: "Best Farmer",
    icon: "🏆",
    command: "Best farmer this month",
    color: "#FFA000",
  },
  {
    label: "Active Vehicles",
    icon: "🚛",
    command: "Show active vehicles",
    color: "#1B5E20",
  },
  {
    label: "Monthly Report",
    icon: "📊",
    command: "Monthly revenue",
    color: "#FF6F00",
  },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ChatBot() {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    { role: string; content: string }[]
  >([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Load chat history
  useEffect(() => {
    const saved = localStorage.getItem("smartveg_chat_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(
          parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })),
        );
      } catch (e) {}
    } else {
      // Beautiful welcome message
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        text: '🌱 **Welcome to SmartVeg AI Assistant!**\n\nI\'m your intelligent logistics companion for **Smart Veg Logistics** — your complete vegetable supply chain management solution.\n\n## ✨ What I Can Help You With\n\n| Category | Commands |\n|----------|----------|\n| 📋 **Orders** | "Today\'s orders", "Pending orders" |\n| 📦 **Stock** | "Current stock", "Low stock alert" |\n| 👨‍🌾 **Farmers** | "Best farmer", "Farmer report" |\n| 🚚 **Deliveries** | "Pending deliveries", "Track delivery" |\n| 🚛 **Vehicles** | "Active vehicles", "Fleet status" |\n| 💰 **Revenue** | "Today\'s revenue", "Monthly report" |\n\n## 🚀 Quick Start\n\nType **"help"** anytime or click any button below to get started!\n\n*How can I assist you with your vegetable logistics today?* 🥬🚛',
        sender: "ai",
        timestamp: new Date(),
        suggestions: [
          "📋 Today's orders",
          "📦 Current stock",
          "🚚 Pending deliveries",
          "💰 Today's revenue",
          "🏆 Best farmer",
        ],
        quickActions: QUICK_ACTIONS.slice(0, 6),
      };
      setMessages([welcomeMessage]);
      localStorage.setItem(
        "smartveg_chat_history",
        JSON.stringify([welcomeMessage]),
      );
    }
  }, []);

  // Save messages
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("smartveg_chat_history", JSON.stringify(messages));
    }
  }, [messages]);

  // Speech recognition setup
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-IN";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
        setTimeout(() => sendMessage(transcript), 100);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    } else {
      alert("Speech recognition is not supported in this browser");
    }
  };

  const sendMessage = async (message?: string) => {
    const userMessage = message || inputMessage;
    if (!userMessage.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      text: userMessage,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsTyping(true);

    // Update history
    const newHistory = [
      ...conversationHistory,
      { role: "user", content: userMessage },
    ];
    setConversationHistory(newHistory);

    try {
      const token = Cookies.get("token");
      const response = await axios.post(
        `${API_URL}/api/ai/chat`,
        { message: userMessage, history: newHistory },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.text,
        sender: "ai",
        timestamp: new Date(),
        suggestions: response.data.suggestions || [],
        quickActions: response.data.quick_actions || [],
      };
      setMessages((prev) => [...prev, aiMsg]);
      setConversationHistory([
        ...newHistory,
        { role: "assistant", content: response.data.text },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: '⚠️ **Connection Issue**\n\nI\'m having trouble connecting to the server. Please check your connection and try again.\n\n**Try these commands:**\n• "Show today\'s orders"\n• "Current stock"\n• "Pending deliveries"',
        sender: "ai",
        timestamp: new Date(),
        suggestions: ["Try again", "Refresh page", "Contact support"],
        quickActions: QUICK_ACTIONS.slice(0, 4),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearHistory = () => {
    const welcomeMsg: Message = {
      id: Date.now().toString(),
      text: "🧹 **Chat history cleared!**\n\nReady to help you with your logistics needs. What would you like to know?",
      sender: "ai",
      timestamp: new Date(),
      suggestions: ["Today's orders", "Current stock", "Pending deliveries"],
      quickActions: QUICK_ACTIONS.slice(0, 4),
    };
    setMessages([welcomeMsg]);
    setConversationHistory([]);
    localStorage.setItem("smartveg_chat_history", JSON.stringify([welcomeMsg]));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatMessageText = (text: string) => {
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br/>");

    // Format tables
    const tableRegex = /\|(.+)\|\n\|[-:| ]+\|\n((?:\|.+\|\n?)+)/g;
    formatted = formatted.replace(tableRegex, (match, header, rows) => {
      const headers = header
        .split("|")
        .filter(Boolean)
        .map(
          (h: string) =>
            `<th style="padding:8px 12px;background:${alpha("#2E7D32", 0.1)};border:1px solid ${alpha("#2E7D32", 0.2)}">${h.trim()}</th>`,
        )
        .join("");
      const bodyRows = rows
        .trim()
        .split("\n")
        .map((row: string) => {
          const cells = row
            .split("|")
            .filter(Boolean)
            .map(
              (c: string) =>
                `<td style="padding:8px 12px;border:1px solid ${alpha("#2E7D32", 0.15)}">${c.trim()}</table>`,
            )
            .join("");
          return `<tr>${cells}</tr>`;
        })
        .join("");
      return `<table style="width:100%; border-collapse:collapse; margin:12px 0; border-radius:12px; overflow:hidden;">${headers ? `<thead><tr>${headers}</tr></thead>` : ""}<tbody>${bodyRows}</tbody>对照`;
    });

    // Format headings
    formatted = formatted.replace(
      /## (.*?)(<br\/>|$)/g,
      '<h3 style="margin:12px 0 8px;color:#2E7D32;font-size:14px;font-weight:600;">$1</h3>',
    );

    return formatted;
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Zoom in={!isOpen}>
        <Fab
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1000,
            background: "linear-gradient(135deg, #2E7D32 0%, #FF6F00 100%)",
            width: 56,
            height: 56,
            "&:hover": {
              transform: "scale(1.1)",
              background: "linear-gradient(135deg, #1B5E20 0%, #E65100 100%)",
            },
            transition: "all 0.3s ease",
            boxShadow: "0 8px 20px rgba(46,125,50,0.3)",
          }}
          onClick={() => setIsOpen(true)}
        >
          <Badge color="error" variant="dot" overlap="circular">
            <SmartToy sx={{ fontSize: 28, color: "white" }} />
          </Badge>
        </Fab>
      </Zoom>

      {/* Chat Drawer */}
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 450, md: 500 },
            height: "100%",
            borderRadius: { xs: 0, sm: "24px 0 0 24px" },
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            background: "#F8FAF5",
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2.5,
            background: "linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              sx={{
                bgcolor: "rgba(255,255,255,0.2)",
                width: 48,
                height: 48,
                background: "linear-gradient(135deg, #FF6F00, #FFA000)",
              }}
            >
              <SmartToy sx={{ fontSize: 26 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                SmartVeg AI
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mt: 0.5,
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "#4CAF50",
                    animation: "pulse 2s infinite",
                  }}
                />
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Online • Ready to assist
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Clear chat">
              <IconButton
                size="small"
                sx={{
                  color: "white",
                  bgcolor: "rgba(255,255,255,0.1)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                }}
                onClick={clearHistory}
              >
                <DeleteSweep />
              </IconButton>
            </Tooltip>
            <Tooltip title="Close">
              <IconButton
                size="small"
                sx={{
                  color: "white",
                  bgcolor: "rgba(255,255,255,0.1)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                }}
                onClick={() => setIsOpen(false)}
              >
                <Close />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Messages Container */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 2.5,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            background: "linear-gradient(180deg, #F8FAF5 0%, #FFFFFF 100%)",
          }}
        >
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: 1.5,
                    flexDirection:
                      msg.sender === "user" ? "row-reverse" : "row",
                  }}
                >
                  <Avatar
                    sx={{
                      width: 38,
                      height: 38,
                      background:
                        msg.sender === "user"
                          ? "linear-gradient(135deg, #FF6F00, #FFA000)"
                          : "linear-gradient(135deg, #2E7D32, #43A047)",
                      flexShrink: 0,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  >
                    {msg.sender === "user" ? (
                      "U"
                    ) : (
                      <SmartToy sx={{ fontSize: 20 }} />
                    )}
                  </Avatar>
                  <Box sx={{ maxWidth: "calc(100% - 58px)" }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.8,
                        bgcolor:
                          msg.sender === "user"
                            ? "linear-gradient(135deg, rgba(255,111,0,0.08), rgba(255,111,0,0.04))"
                            : "#FFFFFF",
                        borderRadius:
                          msg.sender === "user"
                            ? "20px 4px 20px 20px"
                            : "4px 20px 20px 20px",
                        border:
                          msg.sender === "ai"
                            ? "1px solid rgba(46,125,50,0.15)"
                            : "none",
                        boxShadow:
                          msg.sender === "ai"
                            ? "0 2px 12px rgba(0,0,0,0.04)"
                            : "none",
                      }}
                    >
                      <Typography
                        variant="body2"
                        component="div"
                        sx={{
                          lineHeight: 1.6,
                          "& strong": { color: "#2E7D32", fontWeight: 600 },
                          "& code": {
                            bgcolor: "#F0F4F0",
                            px: 0.8,
                            py: 0.3,
                            borderRadius: 1,
                            fontFamily: "monospace",
                            fontSize: "0.8rem",
                          },
                          "& table": {
                            width: "100%",
                            borderCollapse: "collapse",
                            my: 1.5,
                            fontSize: "0.75rem",
                            borderRadius: "12px",
                            overflow: "hidden",
                          },
                          "& th, & td": {
                            padding: "10px 12px",
                            textAlign: "left",
                          },
                          "& th": {
                            background:
                              "linear-gradient(135deg, rgba(46,125,50,0.1), rgba(46,125,50,0.05))",
                            fontWeight: 600,
                            color: "#2E7D32",
                          },
                          "& h3": {
                            margin: "12px 0 8px",
                            color: "#2E7D32",
                            fontSize: "14px",
                            fontWeight: 600,
                          },
                        }}
                        dangerouslySetInnerHTML={{
                          __html: formatMessageText(msg.text),
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          mt: 1,
                          display: "block",
                          color: "#9E9E9E",
                          fontSize: "10px",
                        }}
                      >
                        {formatTime(msg.timestamp)}
                      </Typography>
                    </Paper>

                    {/* Quick Actions */}
                    {msg.quickActions && msg.quickActions.length > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 0.8,
                          mt: 1,
                        }}
                      >
                        {msg.quickActions.slice(0, 3).map((action, i) => (
                          <Chip
                            key={i}
                            label={`${action.icon || "🔹"} ${action.label}`}
                            size="small"
                            onClick={() => sendMessage(action.command)}
                            sx={{
                              bgcolor: "#FFFFFF",
                              border: `1px solid ${alpha("#2E7D32", 0.3)}`,
                              color: "#2E7D32",
                              fontWeight: 500,
                              "&:hover": {
                                bgcolor: alpha("#2E7D32", 0.08),
                                transform: "translateY(-1px)",
                              },
                              transition: "all 0.2s",
                              cursor: "pointer",
                            }}
                          />
                        ))}
                      </Box>
                    )}

                    {/* Suggestions */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 0.8,
                          mt: 1,
                        }}
                      >
                        {msg.suggestions.slice(0, 4).map((suggestion, i) => (
                          <Chip
                            key={i}
                            label={suggestion}
                            size="small"
                            variant="outlined"
                            onClick={() => sendMessage(suggestion)}
                            sx={{
                              borderColor: alpha("#FF6F00", 0.4),
                              color: "#FF6F00",
                              "&:hover": {
                                bgcolor: alpha("#FF6F00", 0.08),
                                borderColor: "#FF6F00",
                              },
                              cursor: "pointer",
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Avatar
                  sx={{
                    width: 38,
                    height: 38,
                    background: "linear-gradient(135deg, #2E7D32, #43A047)",
                  }}
                >
                  <SmartToy sx={{ fontSize: 20 }} />
                </Avatar>
                <Paper
                  sx={{
                    p: 1.8,
                    borderRadius: "4px 20px 20px 20px",
                    bgcolor: "#FFFFFF",
                  }}
                >
                  <Box sx={{ display: "flex", gap: 0.8 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        bgcolor: "#2E7D32",
                        animation: "bounce 1.4s infinite ease-in-out",
                      }}
                    />
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        bgcolor: "#2E7D32",
                        animation: "bounce 1.4s infinite ease-in-out 0.2s",
                      }}
                    />
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        bgcolor: "#2E7D32",
                        animation: "bounce 1.4s infinite ease-in-out 0.4s",
                      }}
                    />
                  </Box>
                </Paper>
              </Box>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <Box
          sx={{
            p: 2.5,
            borderTop: "1px solid rgba(46,125,50,0.1)",
            bgcolor: "#FFFFFF",
          }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title={isListening ? "Listening..." : "Voice Input"}>
              <IconButton
                onClick={startListening}
                sx={{
                  bgcolor: isListening ? alpha("#E53935", 0.1) : "#F5F5F5",
                  color: isListening ? "#E53935" : "#757575",
                  "&:hover": {
                    bgcolor: isListening ? alpha("#E53935", 0.2) : "#EEEEEE",
                  },
                }}
              >
                {isListening ? <MicOff /> : <Mic />}
              </IconButton>
            </Tooltip>
            <TextField
              fullWidth
              size="medium"
              placeholder="Ask me anything about your logistics..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              inputRef={inputRef}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  bgcolor: "#F8FAF5",
                  "& fieldset": {
                    borderColor: alpha("#2E7D32", 0.2),
                  },
                  "&:hover fieldset": {
                    borderColor: alpha("#2E7D32", 0.4),
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#2E7D32",
                  },
                },
              }}
            />
            <IconButton
              onClick={() => sendMessage()}
              disabled={!inputMessage.trim()}
              sx={{
                bgcolor: inputMessage.trim()
                  ? "linear-gradient(135deg, #2E7D32, #43A047)"
                  : "#F5F5F5",
                color: inputMessage.trim() ? "white" : "#BDBDBD",
                "&:hover": {
                  bgcolor: inputMessage.trim()
                    ? "linear-gradient(135deg, #1B5E20, #2E7D32)"
                    : "#EEEEEE",
                  transform: inputMessage.trim() ? "scale(1.02)" : "none",
                },
                transition: "all 0.2s",
              }}
            >
              <Send />
            </IconButton>
          </Box>

          {/* Quick Action Chips */}
          <Box sx={{ display: "flex", gap: 0.8, mt: 1.5, flexWrap: "wrap" }}>
            {QUICK_ACTIONS.slice(0, 8).map((action, i) => (
              <Chip
                key={i}
                label={`${action.icon} ${action.label}`}
                size="small"
                onClick={() => sendMessage(action.command)}
                sx={{
                  bgcolor: alpha(action.color || "#2E7D32", 0.08),
                  color: action.color || "#2E7D32",
                  border: `1px solid ${alpha(action.color || "#2E7D32", 0.2)}`,
                  fontWeight: 500,
                  fontSize: "0.7rem",
                  "&:hover": {
                    bgcolor: alpha(action.color || "#2E7D32", 0.15),
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.2s",
                  cursor: "pointer",
                }}
              />
            ))}
          </Box>
        </Box>
      </Drawer>

      <style jsx global>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }

        @keyframes bounce {
          0%,
          60%,
          100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-6px);
          }
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: #f0f4f0;
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #2e7d32, #43a047);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #1b5e20, #2e7d32);
        }
      `}</style>
    </>
  );
}
