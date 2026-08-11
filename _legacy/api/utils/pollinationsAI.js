const Groq = require('groq-sdk');

/**
 * Groq API utility for text generation
 * Free AI service - replaces Pollinations.ai
 */
class PollinationsAI {
  constructor() {
    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }

  /**
   * Generate text completion using Groq
   * @param {string} prompt - The input prompt
   * @param {Object} options - Additional options
   * @returns {Promise<string>} Generated text response
   */
  async generateText(prompt, options = {}) {
    try {
      console.log('🟢 Calling Groq API...');
      const response = await this.client.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: options.model || "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 1024,
      });

      console.log('✅ Groq responded successfully');

      if (response.choices && response.choices[0]) {
        return response.choices[0].message.content;
      } else {
        throw new Error('Unexpected response format from Groq API');
      }
    } catch (error) {
      console.error('❌ Groq API error:', error.message);
      throw error;
    }
  }

  /**
   * Generate content with structured input (Gemini-compatible format)
   * @param {Object} contentData - Structured content data
   * @returns {Promise<Object>} Response in Gemini-compatible format
   */
  async generateContent(contentData) {
    try {
      let prompt = '';

      if (contentData.contents && contentData.contents[0] && contentData.contents[0].parts) {
        prompt = contentData.contents[0].parts
          .filter(part => part.text)
          .map(part => part.text)
          .join('\n\n');
      } else {
        prompt = contentData.prompt || contentData.text || JSON.stringify(contentData);
      }

      console.log('📝 Prompt length:', prompt.length, 'characters');

      const generatedText = await this.generateText(prompt);

      // Return in Gemini-compatible format — nothing else in your project needs to change
      return {
        response: {
          candidates: [
            {
              content: {
                parts: [{ text: generatedText }]
              }
            }
          ]
        }
      };
    } catch (error) {
      console.error('❌ Content generation error:', error.message);
      throw error;
    }
  }
}

module.exports = PollinationsAI;