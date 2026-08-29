/**
 * Service for providing AI chat responses using Pollinations AI
 * Implementation follows Pollinations.AI API documentation
 * Free AI service with no API key requirements
 * 
 * API Endpoints Used:
 * - POST https://text.pollinations.ai/openai (OpenAI-compatible)
 * - POST https://text.pollinations.ai/ (Advanced text generation)
 * - GET https://text.pollinations.ai/{prompt} (Simple text generation)
 * - GET https://text.pollinations.ai/models (Available models)
 */

export interface AIResponse {
  success: boolean;
  content: string;
  error?: string;
}

export interface PollinationsModel {
  name: string;
  description?: string;
}

/**
 * Generate chat response using Pollinations AI
 * Follows the multi-endpoint strategy from Pollinations.AI documentation
 */
export const generateChatResponse = async (prompt: string): Promise<AIResponse> => {
  try {
    // Try OpenAI-compatible endpoint first for structured responses
    const response = await fetchFromPollinationsOpenAI(prompt);
    if (response.success) {
      return response;
    }
    
    // Fallback to advanced POST endpoint
    const fallbackResponse = await fetchFromPollinationsAdvanced(prompt);
    if (fallbackResponse.success) {
      return fallbackResponse;
    }
    
    // Final fallback to simple GET endpoint
    const getFallback = await fetchFromPollinationsSimple(prompt);
    if (getFallback.success) {
      return getFallback;
    }
    
    // If all Pollinations endpoints fail, use intelligent rule-based fallback
    console.warn('All Pollinations AI endpoints blocked by firewall. Using intelligent fallback system. Enable access in repository settings.');
    return generateIntelligentFallback(prompt);
  } catch (error) {
    console.error('Error generating response:', error);
    return generateIntelligentFallback(prompt);
  }
};

/**
 * Intelligent rule-based fallback when API is unavailable
 */
const generateIntelligentFallback = (prompt: string): AIResponse => {
  try {
    // Extract the user message from the full prompt
    const userMessageMatch = prompt.match(/User message:\s*(.+)$/i);
    const userMessage = userMessageMatch ? userMessageMatch[1].trim() : prompt;
    
    // Extract business information from context
    const businessInfo = extractBusinessInfo(prompt);
    
    // Generate contextual response
    const response = generateIntelligentResponse(userMessage, businessInfo);
    
    return {
      success: true,
      content: response
    };
  } catch (error) {
    return {
      success: false,
      content: "I'm here to help! How can I assist you today?",
      error: error instanceof Error ? error.message : 'Fallback system error'
    };
  }
};

/**
 * Generate intelligent responses based on user input and business context
 */
const generateIntelligentResponse = (userMessage: string, businessInfo: any): string => {
  const lowerMessage = userMessage.toLowerCase();
  
  // Greeting responses
  if (lowerMessage.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
    return `Hello! I'm here to help you with ${businessInfo.name || 'our services'}. How can I assist you today?`;
  }
  
  // Farewell responses
  if (lowerMessage.match(/(bye|goodbye|see you|farewell|talk later)/)) {
    return "Goodbye! Thank you for your interest. Feel free to reach out anytime if you need assistance!";
  }
  
  // Gratitude responses
  if (lowerMessage.match(/(thank you|thanks|appreciate)/)) {
    return "You're very welcome! Is there anything else I can help you with?";
  }
  
  // Pricing related queries
  if (lowerMessage.match(/(price|cost|pricing|how much|rate|fee|charge)/)) {
    if (businessInfo.pricing) {
      return `Our pricing is: ${businessInfo.pricing}. Let me know if you need more details about specific services!`;
    }
    return "I'd be happy to help with pricing information. Could you specify which service you're interested in?";
  }
  
  // Service related queries
  if (lowerMessage.match(/(service|what do you do|what do you offer|product)/)) {
    if (businessInfo.description) {
      return `We specialize in ${businessInfo.description}. ${businessInfo.category ? `Our focus is on ${businessInfo.category}.` : ''} How can we help you?`;
    }
    return "We offer various services to meet your needs. What specific area are you interested in?";
  }
  
  // Contact and support queries
  if (lowerMessage.match(/(contact|support|help|reach|email|phone|address)/)) {
    let response = "I'm here to help you right now! ";
    if (businessInfo.website) {
      response += `You can also visit our website at ${businessInfo.website}. `;
    }
    response += "What specific assistance do you need?";
    return response;
  }
  
  // Default contextual response
  return generateContextualDefault(userMessage, businessInfo);
};

/**
 * Extract business information from the full context
 */
const extractBusinessInfo = (context: string) => {
  const info: any = {};
  
  // Extract business name
  const nameMatch = context.match(/Bussiness Name\s*:\s*([^,\n]+)/i);
  if (nameMatch) info.name = nameMatch[1].trim();
  
  // Extract business category
  const categoryMatch = context.match(/Bussiness Category\s*:\s*([^,\n]+)/i);
  if (categoryMatch) info.category = categoryMatch[1].trim();
  
  // Extract business description
  const descMatch = context.match(/Bussiness Description\s*:\s*([^,\n]+)/i);
  if (descMatch) info.description = descMatch[1].trim();
  
  // Extract pricing information
  const pricingMatch = context.match(/(\$\d+[^,\n]*|pricing[^,\n]*)/i);
  if (pricingMatch) info.pricing = pricingMatch[1].trim();
  
  // Extract website
  const websiteMatch = context.match(/(https?:\/\/[^\s,\n]+|[a-z]+\.[a-z]+\/[^\s,\n]*)/i);
  if (websiteMatch) info.website = websiteMatch[1].trim();
  
  return info;
};

/**
 * Generate contextual default response
 */
const generateContextualDefault = (userMessage: string, businessInfo: any): string => {
  const responses = [
    `I'd be happy to help you with that! ${businessInfo.name ? `At ${businessInfo.name}, ` : ''}we aim to provide the best assistance possible.`,
    `That's a great question! ${businessInfo.description ? `Since we specialize in ${businessInfo.description}, ` : ''}I can help you find the right information.`,
    `Thanks for reaching out! Let me help you with that. ${businessInfo.category ? `Our expertise in ${businessInfo.category} ` : ''}What specific details do you need?`
  ];
  
  // Select response based on message length for variation
  const index = userMessage.length % responses.length;
  return responses[index] + " Could you provide more specific details about what you're looking for?";
};

/**
 * Fetch available models from Pollinations AI
 * GET https://text.pollinations.ai/models
 */
export const getAvailableModels = async (): Promise<PollinationsModel[]> => {
  try {
    const response = await fetch('https://text.pollinations.ai/models', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const models = await response.json();
    return Array.isArray(models) ? models : [];
  } catch (error) {
    console.warn('Could not fetch Pollinations AI models:', error);
    return [
      { name: 'openai', description: 'Default OpenAI-compatible model' },
      { name: 'anthropic', description: 'Anthropic Claude model' },
      { name: 'gpt-4', description: 'GPT-4 model' }
    ];
  }
};

/**
 * Fetch response using Pollinations OpenAI-compatible endpoint
 * POST https://text.pollinations.ai/openai
 */
const fetchFromPollinationsOpenAI = async (prompt: string): Promise<AIResponse> => {
  try {
    const response = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful customer service chatbot. Provide friendly, helpful, and informative responses. Keep responses concise but informative.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return {
        success: true,
        content: data.choices[0].message.content.trim()
      };
    }
    
    throw new Error('Invalid response format from OpenAI endpoint');
  } catch (error) {
    // Check if it's a network error (domain blocked)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Pollinations AI appears to be blocked by firewall. Enable access in repository settings.');
    }
    console.error('OpenAI endpoint failed:', error);
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'OpenAI endpoint failed'
    };
  }
};

/**
 * Fetch response using Pollinations advanced POST endpoint
 * POST https://text.pollinations.ai/
 */
const fetchFromPollinationsAdvanced = async (prompt: string): Promise<AIResponse> => {
  try {
    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful customer service chatbot. Provide friendly, helpful, and informative responses. Keep responses concise but informative.'
          },
          {
            role: 'user', 
            content: prompt
          }
        ],
        model: 'openai'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const textResponse = await response.text();
    
    if (textResponse && textResponse.trim()) {
      return {
        success: true,
        content: textResponse.trim()
      };
    }
    
    throw new Error('Empty response from Pollinations advanced endpoint');
  } catch (error) {
    // Check if it's a network error (domain blocked)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Pollinations AI appears to be blocked by firewall. Enable access in repository settings.');
    }
    console.error('Pollinations advanced endpoint failed:', error);
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Advanced endpoint failed'
    };
  }
};

/**
 * Fetch response using Pollinations simple GET endpoint as fallback
 * GET https://text.pollinations.ai/{prompt}
 */
const fetchFromPollinationsSimple = async (prompt: string): Promise<AIResponse> => {
  try {
    // Extract just the user message for the GET endpoint
    const userMessageMatch = prompt.match(/User message:\s*(.+)$/i);
    const userMessage = userMessageMatch ? userMessageMatch[1].trim() : prompt;
    
    // Encode the message for URL
    const encodedPrompt = encodeURIComponent(userMessage);
    const response = await fetch(`https://text.pollinations.ai/${encodedPrompt}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const textResponse = await response.text();
    
    if (textResponse && textResponse.trim()) {
      return {
        success: true,
        content: textResponse.trim()
      };
    }
    
    throw new Error('Empty response from Pollinations GET endpoint');
  } catch (error) {
    console.error('Pollinations simple GET endpoint failed:', error);
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Simple GET endpoint failed'
    };
  }
};

/**
 * Generate suggestions based on business context using Pollinations AI
 * Utilizes multiple endpoints for optimal results
 */
export const generateSuggestions = async (businessDetails: string): Promise<string[]> => {
  try {
    const prompt = `Based on this business: "${businessDetails}"

Generate exactly 4 short customer questions (each under 40 characters). Return only the questions, one per line:`;
    
    const response = await generateChatResponse(prompt);
    
    if (response.success && response.content) {
      // Parse the response to extract suggestions
      const suggestions = response.content
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 5 && s.length < 50) // Filter reasonable length suggestions
        .map(s => s.replace(/^\d+[\.\)\-\s]*/, '')) // Remove numbers/bullets
        .filter(s => s.includes('?') || s.toLowerCase().includes('what') || s.toLowerCase().includes('how')) // Keep question-like content
        .slice(0, 4); // Take first 4 suggestions
      
      // If we got good suggestions, return them
      if (suggestions.length >= 2) {
        console.log('Generated AI suggestions:', suggestions);
        return suggestions;
      }
    }
    
    // Fallback to intelligent suggestions based on business content
    console.log('Using fallback suggestion generation');
    return generateFallbackSuggestions(businessDetails);
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    return generateFallbackSuggestions(businessDetails);
  }
};

/**
 * Generate fallback suggestions based on business context analysis
 */
const generateFallbackSuggestions = (businessDetails: string): string[] => {
  const businessLower = businessDetails.toLowerCase();
  const suggestions = [];
  
  // Smart suggestion generation based on business content
  if (businessLower.includes('service') || businessLower.includes('development') || businessLower.includes('consulting')) {
    suggestions.push('What services do you offer?');
  }
  if (businessLower.includes('price') || businessLower.includes('cost') || businessLower.includes('$') || businessLower.includes('rate')) {
    suggestions.push('What are your prices?');
  }
  if (businessLower.includes('support') || businessLower.includes('help') || businessLower.includes('24/7') || businessLower.includes('assistance')) {
    suggestions.push('How can I get support?');
  }
  if (businessLower.includes('contact') || businessLower.includes('email') || businessLower.includes('reach')) {
    suggestions.push('How do I contact you?');
  }
  if (businessLower.includes('time') || businessLower.includes('hour') || businessLower.includes('schedule') || businessLower.includes('availability')) {
    suggestions.push('What are your hours?');
  }
  if (businessLower.includes('location') || businessLower.includes('address') || businessLower.includes('where') || businessLower.includes('onsite')) {
    suggestions.push('Where are you located?');
  }
  if (businessLower.includes('website') || businessLower.includes('online') || businessLower.includes('web')) {
    suggestions.push('Do you have a website?');
  }
  if (businessLower.includes('about') || businessLower.includes('company') || businessLower.includes('business')) {
    suggestions.push('Tell me about your company');
  }
  
  // Fill with intelligent defaults if not enough suggestions
  const commonSuggestions = [
    'What services do you offer?', 
    'What are your prices?', 
    'How can I get support?', 
    'How do I contact you?', 
    'What are your hours?', 
    'Tell me about your company',
    'Do you have a website?', 
    'Where are you located?'
  ];
  
  for (const suggestion of commonSuggestions) {
    if (!suggestions.includes(suggestion) && suggestions.length < 4) {
      suggestions.push(suggestion);
    }
  }
  
  return suggestions.slice(0, 4);
};

/**
 * Generate image using Pollinations AI (for future use)
 * GET https://image.pollinations.ai/prompt/{prompt}
 */
export const generateImage = async (prompt: string): Promise<string> => {
  try {
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}`;
    
    // Test if the image URL is accessible
    const response = await fetch(imageUrl, { method: 'HEAD' });
    
    if (response.ok) {
      return imageUrl;
    }
    
    throw new Error('Image generation failed');
  } catch (error) {
    console.warn('Image generation not available:', error);
    return '';
  }
};

/**
 * Get available image models from Pollinations AI
 * GET https://image.pollinations.ai/models
 */
export const getImageModels = async (): Promise<PollinationsModel[]> => {
  try {
    const response = await fetch('https://image.pollinations.ai/models', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const models = await response.json();
    return Array.isArray(models) ? models : [];
  } catch (error) {
    console.warn('Could not fetch Pollinations AI image models:', error);
    return [];
  }
};