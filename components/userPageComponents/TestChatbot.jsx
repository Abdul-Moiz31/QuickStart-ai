import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Send } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { systemPrompt } from "./prompt";
import { useSelector } from "react-redux";

const genAI = new GoogleGenerativeAI("AIzaSyA24-UkGZQEIYZT2XNh4kQqFQ88v5vfml4");

const TestChatbot = () => {
  const [messages, setMessages] = useState([
    { sender: "Bot", message: "Hello! How can I assist you today?" },
  ]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Access user data from Redux store
  const { user } = useSelector((state) => state.user);
  const chatbotDetails = user || {};

  // Scroll to the bottom whenever new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send a message
  const handleSendMessage = async () => {
    if (messageInput.trim()) {
      const newMessages = [...messages, { sender: "You", message: messageInput }];
      setMessages(newMessages);
      setMessageInput("");
      setLoading(true);

      // Generate business details from user data
      let businessDetails = `Business Name: ${chatbotDetails.bussinessName || "N/A"}, `;
      businessDetails += `Category: ${chatbotDetails.bussinessCategory || "N/A"}, `;
      businessDetails += `Description: ${chatbotDetails.bussinessDescription || "N/A"}, `;
      businessDetails += "Details: ";
      chatbotDetails.bussinessDetails?.forEach((item) => {
        businessDetails += `${item.question}: ${item.answer}, `;
      });

      try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const result = await model.generateContentStream({
          contents: [
            {
              role: "user",
              parts: [
                { text: systemPrompt },
                { text: businessDetails },
                {
                  text:
                    newMessages[newMessages.length - 2]?.message || "",
                },
                { text: messageInput },
              ],
            },
          ],
        });

        const botMessageIndex = newMessages.length;
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: "Bot", message: "Typing..." }, // Placeholder while bot is typing
        ]);

        // Collect response chunks
        let content = "";
        for await (const chunk of result.stream) {
          content += chunk.text();
          setMessages((prevMessages) =>
            prevMessages.map((msg, index) =>
              index === botMessageIndex
                ? { sender: "Bot", message: content }
                : msg
            )
          );
        }
      } catch (error) {
        console.error("Error fetching response:", error);
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: "Bot", message: "Sorry, something went wrong." },
        ]);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full p-4 bg-gray-100 rounded-lg">
      <ScrollArea className="flex-1 overflow-y-auto mb-2 p-4 bg-white shadow-md rounded-lg min-h-[70vh]">
        {messages.map((chat, index) => (
          <div
            key={index}
            className={`mb-4 max-w-[90%] ${
              chat.sender === "You" ? "ml-auto text-right" : "mr-auto text-left"
            }`}
          >
            <span
              className={`inline-block p-2 rounded-lg ${
                chat.sender === "You" ? "bg-gray-400 text-black" : "bg-purple-500 text-white"
              } `}
            >
              {chat.message}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </ScrollArea>

      <div className="flex items-center mt-4">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 rounded-lg bg-white shadow-md border border-gray-300 focus:ring focus:ring-purple-300"
          disabled={loading}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
        />
        <button
          onClick={handleSendMessage}
          className="ml-2 p-2 rounded-lg text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors"
          disabled={loading}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default TestChatbot;
