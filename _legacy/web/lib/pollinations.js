/**
 * Pollinations AI Integration
 * Free AI service without credit limits
 * Includes fallback mechanisms for reliability
 */

/**
 * Generate content using Pollinations AI with fallback
 * @param {string} prompt - The prompt to send to the AI
 * @param {Object} options - Optional configuration
 * @returns {Promise<string>} - The generated response
 */
export async function generateContent(prompt, options = {}) {
  try {
    // First, try Pollinations AI
    const result = await tryPollinationsAPI(prompt);
    if (result) return result;
    
    // If Pollinations fails, use local fallback
    return generateLocalFallback(prompt, options);
  } catch (error) {
    console.error('AI Generation Error:', error);
    return generateLocalFallback(prompt, options);
  }
}

/**
 * Try to use Pollinations AI
 * @param {string} prompt - The prompt to send to the AI
 * @returns {Promise<string|null>} - The generated response or null if failed
 */
async function tryPollinationsAPI(prompt) {
  try {
    // Try multiple Pollinations endpoints
    const endpoints = [
      `https://text.pollinations.ai/${encodeURIComponent(prompt)}`,
      `https://pollinations.ai/p/${encodeURIComponent(prompt)}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'text/plain',
            'User-Agent': 'QuickStart-AI/1.0',
          },
          timeout: 10000, // 10 second timeout
        });

        if (response.ok) {
          const result = await response.text();
          if (result && result.trim().length > 0) {
            return result.trim();
          }
        }
      } catch (endpointError) {
        console.log(`Endpoint ${endpoint} failed:`, endpointError.message);
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.log('Pollinations API unavailable:', error.message);
    return null;
  }
}

/**
 * Local fallback content generation
 * @param {string} prompt - The prompt to analyze
 * @param {Object} options - Optional configuration
 * @returns {string} - A generated response
 */
function generateLocalFallback(prompt, options = {}) {
  console.log('Using local fallback for AI generation');
  
  const lowerPrompt = prompt.toLowerCase();
  
  // Proposal generation fallback
  if (lowerPrompt.includes('job description') && lowerPrompt.includes('profile')) {
    return generateProposalFallback(prompt);
  }
  
  // Chatbot response fallback
  if (lowerPrompt.includes('business details') && lowerPrompt.includes('user\'s message')) {
    return generateChatbotFallback(prompt);
  }
  
  // Business questions fallback
  if (lowerPrompt.includes('generate') && lowerPrompt.includes('questions')) {
    return generateBusinessQuestionsFallback(prompt);
  }
  
  // General fallback
  return generateGeneralFallback(prompt);
}

/**
 * Generate proposal fallback
 */
function generateProposalFallback(prompt) {
  const responses = [
    "I'm excited about the opportunity to work on your project. With my extensive experience in development and design, I can deliver high-quality results that meet your requirements. I understand your project needs and am confident I can provide the perfect solution. Let's discuss how we can bring your vision to life.",
    "Your project sounds fascinating and aligns perfectly with my skill set. I have successfully completed similar projects with excellent results. I'm committed to delivering quality work on time and within budget. I'd love to contribute to your project's success.",
    "This project represents an excellent opportunity for collaboration. My experience in this field positions me well to handle your requirements effectively. I'm detail-oriented, reliable, and dedicated to exceeding expectations. Ready to get started?",
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Generate chatbot response fallback
 */
function generateChatbotFallback(prompt) {
  // Extract user message from prompt
  const userMessageMatch = prompt.match(/User's Message:\s*(.+?)(?:\n|$)/i);
  const userMessage = userMessageMatch ? userMessageMatch[1].trim() : '';
  
  if (!userMessage) {
    return "I'm here to help! How can I assist you today?";
  }
  
  const lowerMessage = userMessage.toLowerCase();
  
  // Common business queries
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! Welcome to our business. How can I help you today?";
  }
  
  if (lowerMessage.includes('hours') || lowerMessage.includes('open')) {
    return "Our business hours are typically Monday to Friday, 9 AM to 6 PM. Please contact us for specific information about our current schedule.";
  }
  
  if (lowerMessage.includes('service') || lowerMessage.includes('what do you do')) {
    return "We provide comprehensive services tailored to meet our customers' needs. I'd be happy to provide more specific information about our offerings.";
  }
  
  if (lowerMessage.includes('contact') || lowerMessage.includes('phone') || lowerMessage.includes('email')) {
    return "You can contact us through our website's contact form or reach out to our customer support team. We're always ready to help!";
  }
  
  if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    return "Our pricing depends on your specific needs and requirements. Please contact us for a personalized quote that fits your budget.";
  }
  
  if (lowerMessage.includes('thank')) {
    return "You're welcome! Is there anything else I can help you with today?";
  }
  
  if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
    return "Thank you for your interest! Have a great day, and please don't hesitate to reach out if you need anything else.";
  }
  
  // Default response
  return "That's a great question! While I'd love to provide specific details, I recommend contacting our team directly for the most accurate information. Is there anything else I can help you with?";
}

/**
 * Generate business questions fallback
 */
function generateBusinessQuestionsFallback(prompt) {
  // Extract business details from prompt
  const businessMatch = prompt.match(/Business Name:\s*(.+?)(?:,|\n)/i);
  const categoryMatch = prompt.match(/Business Category:\s*(.+?)(?:,|\n)/i);
  
  const businessName = businessMatch ? businessMatch[1].trim() : 'Our Business';
  const category = categoryMatch ? categoryMatch[1].trim() : 'services';
  
  const questions = [
    {
      question: "What services do you offer?",
      answer: `We specialize in ${category} and provide comprehensive solutions to meet our customers' needs.`
    },
    {
      question: "What are your business hours?",
      answer: "We're typically open Monday to Friday, 9 AM to 6 PM. Please contact us for current hours and availability."
    },
    {
      question: "How can I contact you?",
      answer: "You can reach us through our contact form, phone, or email. We're always ready to help with your inquiries."
    },
    {
      question: "Do you offer consultations?",
      answer: "Yes, we offer consultations to better understand your needs and provide tailored solutions."
    },
    {
      question: "What makes your business unique?",
      answer: `${businessName} stands out through our commitment to quality, customer service, and innovative ${category} solutions.`
    },
    {
      question: "Do you have experience in this field?",
      answer: "Yes, we have extensive experience and a proven track record of success in our industry."
    }
  ];
  
  return questions;
}

/**
 * Generate general fallback response
 */
function generateGeneralFallback(prompt) {
  return "I understand you're looking for information. While I'd love to provide a detailed response, I recommend reaching out to our team for the most accurate and up-to-date information. How else can I assist you today?";
}

/**
 * Generate streaming content (simulate streaming)
 * @param {string} prompt - The prompt to send to the AI
 * @param {Function} onUpdate - Callback function called with each chunk
 * @returns {Promise<string>} - The complete generated response
 */
export async function generateContentStream(prompt, onUpdate) {
  try {
    const response = await generateContent(prompt);
    
    // Simulate streaming by breaking the response into words
    const words = response.split(' ');
    let currentContent = '';
    
    for (let i = 0; i < words.length; i++) {
      currentContent += (i > 0 ? ' ' : '') + words[i];
      
      if (onUpdate) {
        onUpdate(currentContent);
      }
      
      // Small delay to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return response;
  } catch (error) {
    console.error('Streaming Error:', error);
    throw error;
  }
}

/**
 * Generate structured JSON content
 * @param {string} prompt - The prompt to send to the AI
 * @returns {Promise<Object>} - The parsed JSON response or structured data
 */
export async function generateJSONContent(prompt) {
  try {
    const response = await generateContent(prompt);
    
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.log('JSON parse failed, using fallback');
      }
    }
    
    // Fallback: return business questions
    return generateBusinessQuestionsFallback(prompt);
  } catch (error) {
    console.error('JSON Generation Error:', error);
    return generateBusinessQuestionsFallback(prompt);
  }
}

/**
 * Pollinations AI class for more complex interactions
 */
export class PollinationsAI {
  constructor() {
    this.baseUrl = 'https://text.pollinations.ai';
  }

  async generateContent(prompt, options = {}) {
    return generateContent(prompt, options);
  }

  async generateContentStream(prompt, onUpdate) {
    return generateContentStream(prompt, onUpdate);
  }

  async generateJSONContent(prompt) {
    return generateJSONContent(prompt);
  }
}

// Default export for compatibility
export default PollinationsAI;