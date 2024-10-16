'use client'

import { Send } from "lucide-react"
import React, { useState, useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useDispatch, useSelector } from "react-redux"
import { getAllSessions, getAllMessages } from "@/slices/userSlice"
import Loader from "@/components/Loader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function Chat() {
  const dispatch = useDispatch()
  const { sessions } = useSelector((state) => state.user)
  const { messages, loading: messagesLoading } = useSelector((state) => state.user)
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [messageInput, setMessageInput] = useState("")
  
  const messagesEndRef = useRef(null)

  useEffect(() => {
    dispatch(getAllSessions())
  }, [dispatch])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSelectUser = (userId) => {
    setSelectedUserId(userId)
    dispatch(getAllMessages(userId))
  }

  const handleSendMessage = () => {
    console.log("Sending message:", messageInput)
    setMessageInput("")
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] shadow-xl bg-white rounded-xl overflow-hidden">
      {/* Chat Sidebar */}
      <div className="w-full md:w-1/4 bg-white p-4 border-r border-gray-200">
        <h3 className="text-2xl font-bold mb-4 roboty-headings">Recent Sessions</h3>
        <ScrollArea className="h-[calc(100vh-10rem)]">
          <ul className="space-y-2">
            {sessions.map((user) => (
              <li
                key={user._id}
                className={`cursor-pointer p-3 rounded-xl transition-colors ${
                  selectedUserId === user._id ? "bg-[#9e45f1] text-white" : "hover:bg-[#a550f5] hover:text-white "
                }`}
                onClick={() => handleSelectUser(user._id)}
              > 
                <div className="font-bold">{user.username.toUpperCase()}</div>
                <div className="text-sm truncate">{user.lastMessage || "No messages yet"}</div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col h-full">
        {selectedUserId ? (
          <>
            <h3 className="roboty-headings text-2xl font-bold p-4 border-b border-gray-200">
              Chat with {sessions.find(session => session._id === selectedUserId)?.username}
            </h3>
            <ScrollArea className="flex-1 p-4 bg-gray-100">
              {messagesLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader />
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((chat, index) => (
                    <div
                      key={index}
                      className={`flex ${chat.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] p-3 rounded-lg ${
                          chat.role === "user" ? "bg-[#9e45f1] text-white" : "bg-white text-gray-800"
                        }`}
                      >
                        {chat.message}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} className="bg-[#9e45f1] hover:bg-[#a550f5]">
                  <Send className="w-5 h-5 text-white" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a user to view their chat.
          </div>
        )}
      </div>
    </div>
  )
}