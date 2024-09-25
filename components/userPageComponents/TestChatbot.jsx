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

  // Use user data for chatbot details
  const chatbotDetails = user || {}; // Ensure chatbotDetails is an object

  // Scroll to the bottom whenever new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (messageInput.trim()) {
      const updatedMessages = [
        ...messages,
        { sender: "You", message: messageInput },
      ];
      setMessages(updatedMessages);
      const input = messageInput;
      setMessageInput("");
      setLoading(true);
      let businessDetails = "Business Details: ";
      businessDetails += `Business Name: ${
        chatbotDetails.bussinessName || "N/A"
      }, `;
      businessDetails += `Business Category: ${
        chatbotDetails.bussinessCategory || "N/A"
      }, `;
      businessDetails += `Business Description: ${
        chatbotDetails.bussinessDescription || "N/A"
      }, `;
      businessDetails += "Questionnaires: ";
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
                    updatedMessages[updatedMessages.length - 2]?.message || "",
                }, // Safe access
                { text: input },
              ],
            },
          ],
        });

        const botMessageIndex = updatedMessages.length;
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: "Bot", message: "Typing..." }, // Placeholder while bot is typing
        ]);

        // Collect response chunks
        let content = "";
        for await (const chunk of result.stream) {
          content += await chunk.text();

          // Update the last bot message with the new content
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
    <div className="flex flex-col h-full bg-gray-900 p-4 rounded-lg">
      <ScrollArea className="flex-1 open-sans-text overflow-y-auto mb-2 p-4 bg-gray-800 rounded-lg">
        {messages.map((chat, index) => (
          <div
            key={index}
            className={`mb-4 w-[700px] mx-auto ${
              chat.sender === "You" ? "text-right float-right" : "text-left float-left"
            }`}
          >
            <span
              className={`animate-appearance-in inline-block p-2 rounded-lg ${
                chat.sender === "You" ? "bg-blue-500" : "bg-gray-500"
              } text-white`}
            >
              {chat.message}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </ScrollArea>

      <div className="flex items-center">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 rounded-lg bg-gray-700 text-white"
          disabled={loading} // Disable input while loading
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
        />
        <button
          onClick={handleSendMessage}
          className="ml-2 bg-blue-600 p-2 rounded-lg text-white hover:bg-blue-500"
          disabled={loading} // Disable button while loading
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default TestChatbot;
