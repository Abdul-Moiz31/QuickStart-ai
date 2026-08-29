import React, { useState, useEffect, useRef } from "react";
import { generateChatResponse } from "../services/aiService";
import { systemPrompt } from "./prompt";
import generateSession from "../utils/generateSession";
import axios from "axios";
import baseUrl from "../baseUrl";
import styled from "styled-components";
import { keyframes } from "styled-components";
import { IoSend } from "react-icons/io5";
import generateSugesstions from "../utils/generateSuggestions";

interface Message {
  role: "user" | "bot";
  message: string;
}

interface SessionInterface {
  started: boolean;
  email: string;
  username: string;
  sessionId?: string;
}

interface ChatbotProps {
  chatbotDetails: {
    id: string;
    bussinessName: string;
    bussinessCategory: string;
    bussinessDescription: string;
    bussinessDetails: {
      question: string;
      answer: string;
    }[];
  };
  theme?: string;
  position?: "left" | "right";
  wantToShowSuggestions?:boolean;
}

const Chatbot: React.FC<ChatbotProps> = ({
  chatbotDetails,
  theme,
  position,
  wantToShowSuggestions=false
}) => {
  const [session, setSession] = useState<SessionInterface>({
    started: false,
    email: "",
    username: "",
    sessionId: "",
  });
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", message: "Hello! How can I assist you today?" },
  ]);
  const [suggestions,setSuggestions]=useState<string[]>([]);
  const [showSuggestions,setShowSuggestions]=useState<boolean>(false);
  const [input, setInput] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  let bussinessDetails = "Bussiness Details :";

  bussinessDetails += "Bussiness Name : " + chatbotDetails.bussinessName + ",";
  bussinessDetails +=
    "Bussiness Category : " + chatbotDetails.bussinessCategory + ",";
  bussinessDetails +=
    "Bussiness Description : " + chatbotDetails.bussinessDescription + ",";
  bussinessDetails += "Questionaries :";
  chatbotDetails.bussinessDetails.forEach((item) => {
    bussinessDetails += item.question + " : " + item.answer + ",";
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    setShowSuggestions(false);
      if (input.trim() !== "" && !loading) {
      const updatedMessages: Message[] = [
        ...messages,
        { role: "user", message: input },
      ];
      setMessages(updatedMessages);
      const temp = input;
      setInput("");
      setLoading(true);

      try {
        // Construct the full prompt for Pollinations.ai
        const fullPrompt = `${systemPrompt}\n\n${bussinessDetails}\n\nPast message: ${
          updatedMessages[updatedMessages.length - 2].message
        }\n\nUser message: ${temp}`;

        const response = await generateChatResponse(fullPrompt);
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to get response from AI');
        }

        // Placeholder for the bot message
        const botMessageIndex = updatedMessages.length;
        setMessages((prevMessages) => [
          ...prevMessages,
          { role: "bot", message: "Typing..." }, // Placeholder while bot is typing
        ]);

        // Simulate typewriter effect with the response content
        let content = "";
        const typewriterEffect = async (text: string) => {
          for (let i = 0; i < text.length; i++) {
            await new Promise((resolve) => setTimeout(resolve, 10)); // Adjust delay for typing speed
            content += text.charAt(i);
            setMessages((prevMessages) => [
              ...prevMessages.slice(0, botMessageIndex),
              { role: "bot", message: content },
            ]);
            scrollToBottom(); // Ensure it scrolls to the latest message
          }
        };
        
        setLoading(false);
        await typewriterEffect(response.content);

        if(wantToShowSuggestions &&( content.includes("sorry") || content.includes("apologize") || content.includes("error") || content.includes("Sorry"))){
          setShowSuggestions(true);
        }else{
          setShowSuggestions(false);
        }

        // Add messages to sessions
        await axios.post(`${baseUrl}/session/addMessages`, {
          sessionId: session.sessionId,
          botMessage: content,
          userMessage: temp,
          chatbotId: chatbotDetails.id,
        });

       
      } catch (error) {
        console.error("Error fetching response:", error);
        setMessages((prevMessages) => [
          ...prevMessages,
          { role: "bot", message: "Sorry, something went wrong." },
        ]);
      } finally {
        setLoading(false);
        scrollToBottom();
      }
    }else{
      alert("Please enter a valid message");
    }
  };

  const handleStartSession = async () => {
    setLoading(true);
    if (name.trim() !== "" && email.trim() !== "") {
      try {
        const response = await generateSession({
          email,
          username: name,
          chatbotId: chatbotDetails.id,
        });

        setSession({
          started: true,
          email,
          username: name,
          sessionId: response.session._id,
        });
      } catch (error) {
        console.error("Error starting session", error);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };


  useEffect(() => {
    const getSugesstionsList = async () => {
      if (wantToShowSuggestions && showSuggestions) {
        const suggestionsList = await generateSugesstions(bussinessDetails);
        console.log(suggestionsList);
        setSuggestions(suggestionsList);
        console.log(suggestionsList);
      }
    };

    getSugesstionsList();
  }, [wantToShowSuggestions, showSuggestions, bussinessDetails]); 


  const handleSugesstionClick = async (sugg: string) => {
    if (loading) return;  
    
    setInput(sugg);  
    setShowSuggestions(false);  
 
  };

  
  

  if (!session.started) {
    return (
      <ChatbotContainer position={position}>
        <Header theme={theme}>
          <a href="https://quickstart-ai.me" target="_blank" rel="noopener noreferrer">
            QuickStart Chatbot
          </a>
        </Header>

        <FormContainer >
          <HelpImage
            src="https://res.cloudinary.com/dvxvf2vxu/image/upload/v1725171366/help_wa1buy.png"
            alt="Chatbot"
          />
          <FormInput
            theme={theme}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
            required
          />
          <FormInput
            theme={theme}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your Email"
            required
          />
          <FormButton theme={theme} disabled={loading} onClick={handleStartSession}>
            {loading ? "Starting..." : "Start Chat"}
          </FormButton>
        </FormContainer>
      </ChatbotContainer>
    );
  }

  return (
    <ChatbotContainer position={position}>
      <Header theme={theme}><a href="https://quickstart-ai.me" target="_blank" rel="noopener noreferrer">
            QuickStart Chatbot
          </a></Header>
      <MessagesContainer ref={messagesContainerRef}>
        {messages.map((message, index) => (
          <MessageBubble key={index} theme={theme} role={message.role}>
            {message.message}
          </MessageBubble>
        ))}
        {showSuggestions && 
         (
          <SuggestionsContainer>
            {
              suggestions.map(sugg=>(
                <Suggestion theme={theme} onClick={()=>handleSugesstionClick(sugg)}>
                  {sugg}
                </Suggestion>
              ))
            }
          </SuggestionsContainer>
        )
        
        }
        {loading && <MessageBubble theme={theme} role="bot">Typing...</MessageBubble>}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      <ChatInputContainer>
        <ChatInput
          theme={theme}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") handleSendMessage();
          }}
          placeholder="Type a message..."
        />
        <SendButton theme={theme} onClick={handleSendMessage}><IoSend  color="white" width={200} height={100} size={20}/></SendButton>
      </ChatInputContainer>
    </ChatbotContainer>
  );
};

export default Chatbot;

// Styled Components

const slideUp = keyframes`
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const ChatbotContainer = styled.div<{ position?: "left" | "right" }>`
  width: 100%;
  max-width: 380px;
  height: 100%;
  max-height: 500px;
  background-color: #ffffff;
  border-radius: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  position: absolute;
  animation: ${slideUp} 0.3s forwards;
  font-family: "Outfit", sans-serif;
  z-index: 9999;
  transition: transform 0.12s, opacity 0.12s;
  transform-origin: bottom;
  




  
  @media (max-width: 768px) {
    max-height: 100%;
  }
`;

const Header = styled.div<{ theme?: string }>`
  background-color: ${(props) =>
    props.theme === "primary"
      ? "#007bff"
      : props.theme === "secondary"
      ? "#343a40"
      : props.theme === "professional"
      ? "#004085"
      : props.theme === "tech"
      ? "#6c757d"
      : "blue"};
  color: white;
  padding: 16px;
  text-align: center;
  font-size: 1.2em;
  border-radius: 15px 15px 0 0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);

  a {
    color: white;
    text-decoration: none;
  }
`;

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 0 10px;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 0 30px;
  }
`;

const HelpImage = styled.img`
  width: 100%;
  max-width: 220px;
  border-radius: 15px;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  margin-bottom: 20px;
`;

const FormInput = styled.input<{ theme?: string }>`
  width: 100%;
  max-width: 300px;
    font-family: "Outfit", sans-serif;
   padding: 12px;
    margin: 10px 0;
    border-radius: 5px;
    outline:none;
  border: 1px solid
    ${(props) =>
      props.theme === "primary"
        ? "#007bff"
        : props.theme === "secondary"
        ? "#343a40"
        : props.theme === "professional"
        ? "#004085"
        : props.theme === "tech"
        ? "#6c757d"
        : "blue"};
  font-size: 1em;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
    background-color: white !important;
    color: black !important;

  :focus {
    outline: none;
    border:1px solid red;
     
  }
        :placeholder {
    color: #b3b3b3;
  }
    ::placeholder {
    color: #b3b3b3;
    }
`;

const FormButton = styled.button<{ theme?: string }>`
  background-color: ${(props) =>
    props.theme === "primary"
      ? "#007bff"
      : props.theme === "secondary"
      ? "#343a40"
      : props.theme === "professional"
      ? "#004085"
      : props.theme === "tech"
      ? "#6c757d"
      : "blue"};
  color: white;
  border: none;
  border-radius: 5px;
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;

  :hover {
    background-color: ${(props) =>
      props.theme === "primary"
        ? "#0056b3"
        : props.theme === "secondary"
        ? "#23272a"
        : props.theme === "professional"
        ? "#00305a"
        : props.theme === "tech"
        ? "#5a6268"
        : "blue"};
  }

  :disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  :active {
    transform: scale(0.95);
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: #f9f9f9;

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px; /* Width of the scrollbar */
  }

  &::-webkit-scrollbar-track {
    background: #f9f9f9; /* Track color */
    border-radius: 10px; /* Rounded edges */
  }

  &::-webkit-scrollbar-thumb {
    background-color: #b0b0b0; /* Thumb color (scroll handle) */
    border-radius: 10px; /* Rounded thumb */
    border: 2px solid #f9f9f9; /* Adds space around thumb */
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: #909090; /* Change color on hover */
  }

  @media (max-width: 768px) {
    padding: 10px; /* Make padding smaller on mobile */
    &::-webkit-scrollbar {
      width: 6px; /* Make scrollbar thinner on smaller screens */
    }
  }
`;


const MessageBubble = styled.div<{ role: "user" | "bot"; theme?: string }>`
  align-self: ${(props) => (props.role === "user" ? "flex-end" : "flex-start")};
  background-color: ${(props) =>
    props.role === "user"
      ? props.theme === "primary"
        ? "#007bff"
        : props.theme === "secondary"
        ? "#343a40"
        : props.theme === "professional"
        ? "#004085"
        : props.theme === "tech"
        ? "#6c757d"
        : "#e0e0e0"
      : "#e0e0e0"};
  color: ${(props) => (props.role === "user" ? "white" : "black")};
  padding: 12px 18px;
  border-radius: 18px;
  max-width: 80%;
  animation: ${slideUp} 0.3s ease-out;
`;

const ChatInputContainer = styled.div`
  display: flex;
  padding: 8px 16px;
  background-color: #f9f9f9;
  border-top: 1px solid #e0e0e0;


`;

const ChatInput = styled.input<{ theme?: string }>`
  flex: 1;
  border: 1px solid
    ${(props) =>
      props.theme === "primary"
        ? "#007bff"
        : props.theme === "secondary"
        ? "#343a40"
        : props.theme === "professional"
        ? "#004085"
        : props.theme === "tech"
        ? "#6c757d"
        : "blue"};
  padding: 10px;
  border-radius: 4px;
  margin-right: 10px;
  outline:none;
    font-family: "Outfit", sans-serif;
    font-weight:500;
    font-size:0.9em;

  :focus {
    outline: none;
    border-color: ${(props) =>
      props.theme === "primary"
        ? "#007bff"
        : props.theme === "secondary"
        ? "#343a40"
        : props.theme === "professional"
        ? "#004085"
        : props.theme === "tech"
        ? "#6c757d"
        : "blue"};

  }
`;

const SendButton = styled.button<{ theme?: string }>`
  background-color: ${(props) =>
    props.theme === "primary"
      ? "#007bff"
      : props.theme === "secondary"
      ? "#343a40"
      : props.theme === "professional"
      ? "#004085"
      : props.theme === "tech"
      ? "#6c757d"
      : "blue"};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;

  :hover {
    background-color: ${(props) =>
      props.theme === "primary"
        ? "#0056b3"
        : props.theme === "secondary"
        ? "#23272a"
        : props.theme === "professional"
        ? "#00305a"
        : props.theme === "tech"
        ? "#5a6268"
        : "blue"};
  }

  :active {
    transform: scale(0.95);
  }
`;


const SuggestionsContainer=styled.div`

  display:flex;
  flex-direction:row;
  flex-wrap:wrap;
  gap:10px;
  padding:0px;
  background-color:#f9f9f9;
  border-radius:10px;
  max-width:90%;
  animation: ${slideUp} 0.3s ease-out;
  height:fit-content;
  max-height:300px;
`


const Suggestion=styled.div<{theme?:string}>`
  background-color: ${(props) =>
    props.theme === "primary"
      ? "#007bff"
      : props.theme === "secondary"
      ? "#343a40"
      : props.theme === "professional"
      ? "#004085"
      : props.theme === "tech"
      ? "#6c757d"
      : "#e0e0e0"};
  color: white;
  padding: 10px 15px;
  border-radius: 18px;
  max-width: 80%;
  font-size:0.9em;
  animation: ${slideUp} 0.3s ease-out;
  cursor:pointer;
   &:hover {
    transform: translateY(-3px); /* Subtle lift on hover */
    background-color: ${(props) =>
      props.theme === "primary"
        ? "#0056b3"
        : props.theme === "secondary"
        ? "#23272b"
        : props.theme === "professional"
        ? "#003366"
        : props.theme === "tech"
        ? "#5a6268"
        : "#bdbdbd"};
  }
`
