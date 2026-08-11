import React, { ReactNode, useEffect, useState } from 'react';
import { TbMessageChatbot } from 'react-icons/tb';
import { AiOutlineClose } from 'react-icons/ai';
import styled, { keyframes } from 'styled-components';
import Chatbot from './components/chatbot';
import getChatbotDetails from './utils/getChatbotDetails';

interface AppProps {
  icon?: ReactNode;
  toggleBtnBgColor?: string;
  toggleBtncolor?: string;
  animate?: boolean;
  token: string;
  theme?: 'primary' | 'secondary' | 'professional' | 'tech' | '' | undefined;
  position?: 'left' | 'right';
  wantToShowSuggestions?: boolean;
}

interface ChatbotDetails {
  id: string;
  bussinessName: string;
  bussinessCategory: string;
  bussinessDescription: string;
  bussinessDetails: {
    question: string;
    answer: string;
  }[];
}

// Keyframe animations
const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// App container
const AppContainer = styled.div`
  font-family: 'Outfit', sans-serif;
`;

// Chatbot Toggle Button
const ChatbotToggleButton = styled.div<{ position: string; theme: string; animate: boolean }>`
  position: fixed;
  bottom: 20px;
  ${({ position }) => (position === 'left' ? 'left: 20px;' : 'right: 20px;')}
  font-size: 2em;
  cursor: pointer;
  border-radius: 50%;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, background-color 0.3s, color 0.3s;
  ${({ theme }) => (theme === 'primary' ? 'background-color: #007bff; color: white;' : 
  theme === 'secondary' ? 'background-color: #343a40; color: white;' :
  theme === 'professional' ? 'background-color: #004085; color: white;' :
  theme === 'tech' ? 'background-color: #6c757d; color: white;' : 'background-color: #007bff; color: white;'
  )}
  animation: ${(props) => (props.animate ? bounce : 'none')} 1s infinite;
  z-index: 999;
  &:hover {
    transform: scale(1.1);
  }
`;

// Chatbot Wrapper
const ChatbotWrapper = styled.div<{ show: boolean; position: string }>`
  position: fixed;
  ${({ position }) => (position === 'left' ? 'left: 60px;' : 'right: 20px;')}
  bottom: 80px;
  width: 350px;
  height: 500px;
  background-color: #ffffff;
  border-radius: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: opacity 0.4s ease-out, transform 0.4s ease-out;
  ${({ show }) => (show ? 'opacity: 1; transform: translateY(-10px);' : 'opacity: 0; display: none; transform: translateY(20px);')}
  z-index: 999;
  @media (max-width: 768px) {
    width: 330px;
    height: 80%;
  }
`;

// Loader Component
const Loader = styled.div<{ theme: string }>`
  border: 6px solid #f3f3f3;
  border-top: 6px solid ${({ theme }) => (theme === 'primary' ? '#007bff' : '#343a40')};
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: ${spin} 1s linear infinite;
  margin: 150px auto;
  margin-top: 200px;
`;

const App: React.FC<AppProps> = ({
  icon,
  toggleBtnBgColor = '',
  toggleBtncolor = '',
  animate = true,
  token,
  theme = 'primary',
  position = 'right',
  wantToShowSuggestions = false,
}) => {
  const [show, setShow] = useState(false);
  const [chatbotDetails, setChatbotDetails] = useState<ChatbotDetails | null>(null);

  useEffect(() => {
    const fetchChatbotDetails = async () => {
      try {
        const details = await getChatbotDetails(token);
        setChatbotDetails(details);
      } catch (error) {
        console.error(error);
      }
    };

    fetchChatbotDetails();
  }, [token]);

  if (!token) {
    console.error('Valid Token is required');
    throw new Error('Valid Token is required');
  }

  return (
    <AppContainer>
      <ChatbotToggleButton
        position={position}
        theme={theme}
        animate={!show && animate}
        style={{ backgroundColor: toggleBtnBgColor, color: toggleBtncolor }}
        onClick={() => setShow(!show)}
      >
        {show ? <AiOutlineClose /> : icon || <TbMessageChatbot size={45} />}
      </ChatbotToggleButton>

      <ChatbotWrapper show={show} position={position}>
        {chatbotDetails ? (
          <Chatbot chatbotDetails={chatbotDetails} theme={theme} position={position} wantToShowSuggestions={wantToShowSuggestions}/>
        ) : (
          <Loader theme={theme} />
        )}
      </ChatbotWrapper>
    </AppContainer>
  );
};

export default App;
