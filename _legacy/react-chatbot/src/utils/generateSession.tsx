import axios from "axios";
import baseUrl from "../baseUrl";

const generateSession = async ({email,username,chatbotId}: {email: string, username: string, chatbotId: string}) => {
  try {
    const response =await axios.post(`${baseUrl}/session/create`,{
        email,
        username,
        chatbotId
        });

    return response.data;

  } catch (error) {
    console.log(error);
    throw new Error("Something went wrong while generating session");

  }
};

export default generateSession;
