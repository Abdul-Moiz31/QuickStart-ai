import axios from "axios";
import baseUrl from "../baseUrl";

const getChatbotDetails = async (token:string) => {
  try {
    const response =await axios.get(`${baseUrl}/user/token/verify`, {
        params: {
            token:token,
            },
    });

    return response.data.data;

  } catch (error) {
    throw new Error("Something went wrong while fetching chatbot details");
  }
};

export default getChatbotDetails
