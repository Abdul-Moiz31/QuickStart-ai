import { generateSuggestions } from "../services/aiService";

const generateSugesstions = async (bussinessDetails: string) => {
  try {
    const suggestions = await generateSuggestions(bussinessDetails);
    return suggestions;
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return []; // Return an empty array if something goes wrong
  }
};

export default generateSugesstions;
