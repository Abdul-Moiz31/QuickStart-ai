import React, { useState, useEffect } from "react";
import { MdDeleteOutline, MdInfoOutline } from "react-icons/md";
import { FaRobot, FaCommentDots, FaBolt } from "react-icons/fa"; 
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI("AIzaSyA24-UkGZQEIYZT2XNh4kQqFQ88v5vfml4");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" }
});

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useDispatch, useSelector } from "react-redux";
import {
  addBusinessDetails,
  deleteBusinessDetails,
  loadUser,
  clearState,
} from "@/slices/userSlice";
import toast from "react-hot-toast";
import { AiFillThunderbolt } from "react-icons/ai"; 
import { systemPrompt } from "./prompt";

const BusinessDetails = () => {
  const dispatch = useDispatch();
  const {
    isBusinessDetailsAdded,
    isBusinessDetailsDeleted,
    user,
    error,
  } = useSelector((state) => state.user);

  const [formData, setFormData] = useState({
    question: "",
    answer: "",
  });
  const [loading,setLoading] = useState(false);
  
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  useEffect(() => {
    if (isBusinessDetailsAdded) {
      toast.success("Business Details Added Successfully");
      dispatch(clearState());
      dispatch(loadUser());
      setFormData({
        question: "",
        answer: "",
      });
    }
    if (isBusinessDetailsDeleted) {
      dispatch(clearState());
      toast.success("Business Details Deleted Successfully");
      dispatch(loadUser());
    }
    if (error) {
      toast.error(error);
      console.log(error);
    }
  }, [isBusinessDetailsAdded, isBusinessDetailsDeleted]);

  const handleDelete = (index) => {
    // dispatch(deleteBusinessDetails(index, user));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.question || !formData.answer) {
      toast.error("Please fill all the fields");
      return;
    }
    dispatch(addBusinessDetails(formData, user));
  };

  const handleGenerateAI = async () => {
    setLoading(true)
    const businessDetails = `
      Business Name: ${user.bussinessName || "N/A"},
      Business Category: ${user.bussinessCategory || "N/A"},
      Business Description: ${user.bussinessDescription || "N/A"},
      Business Q&A: ${user.bussinessDetails?.map(item => `${item.question}: ${item.answer}`).join(", ")}

      return an array of questions containing the object of question and answer
    `;
  
    const prompt = `
      Generate AI questions for the following business details from user perspective which a user can ask from a chatbot contains the details of business: ${businessDetails}.
    `;
  
    try {
      const result = await model.generateContent(prompt);
      const questions = JSON.parse(result.response.candidates[0].content.parts[0].text);
      setGeneratedQuestions(questions);
    } catch (error) {
      console.error("Error generating AI questions:", error);
      toast.error("An error occurred while generating AI questions.");
    }

    setLoading(false)
  };

  const handlePickQuestion = (question) => {
    setFormData((prev) => ({
      ...prev,
      question: question.question,
      answer: question.answer,
    }));
    // scroll to the top
    window.scrollTo({ top: 0, behavior: "smooth" });
    setGeneratedQuestions([]);

    setLoading(false);
  };

  const handleDropdownToggle = (index) => {
    setSelectedQuestionIndex(selectedQuestionIndex === index ? null : index);
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-gray-900 to-black text-white p-6">
      <Card className="bg-gray-800 w-full max-w-4xl shadow-lg rounded-lg relative z-10 transform transition-transform">
        <CardHeader className="flex justify-between p-6">
          <CardTitle className="text-2xl font-semibold">Company Details</CardTitle>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="p-2 text-gray-400 hover:text-gray-200 transition-all">
                <MdInfoOutline className="text-2xl" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-gray-900 text-white rounded-lg p-6">
              <AlertDialogTitle className="text-lg font-semibold mb-2">
                How to Provide Business Details
              </AlertDialogTitle>
              <AlertDialogDescription>
                <p className="mb-4">
                  To help us train our models effectively, please provide
                  detailed answers to the following:
                </p>
                <ul className="list-disc pl-5 mb-4">
                  <li>Enter business-related questions in the "Question" field.</li>
                  <li>Provide comprehensive answers in the "Answer" field.</li>
                </ul>
              </AlertDialogDescription>
              <div className="mt-4 flex justify-end space-x-2">
                <AlertDialogCancel className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Close
                </AlertDialogCancel>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="question" className="block text-sm font-medium">
                Company Related Question
              </label>
              <div className="relative">
                <Input
                  id="question"
                  name="question"
                  value={formData.question}
                  onChange={handleChange}
                  required
                  placeholder="What is our Company Objective? 🚀"
                  className="mt-2 block w-full border border-gray-600 bg-gray-900 text-white placeholder-gray-500 focus:ring focus:ring-blue-500"
                />
                <FaRobot className="absolute right-3 top-3 text-xl text-gray-500" />
              </div>
            </div>
            <div>
              <label htmlFor="answer" className="block text-sm font-medium">
                Answer
              </label>
              <div className="relative">
                <Textarea
                  id="answer"
                  name="answer"
                  value={formData.answer}
                  onChange={handleChange}
                  required
                  placeholder="Our objective is to provide the best services to our customers... 💼"
                  rows={4}
                  className="mt-2 block w-full border border-gray-600 bg-gray-900 text-white placeholder-gray-500 focus:ring focus:ring-blue-500"
                />
                <FaCommentDots className="absolute right-3 top-3 text-xl text-gray-500" />
              </div>
            </div>

            {/* Generate with AI Button */}
            <Button
              type="button"
              onClick={handleGenerateAI}
              className="w-full py-3 text-lg font-semibold bg-neon transition-all relative text-white bg-purple-600"
              style={{background: 'linear-gradient(90deg, #FF00FF 0%, #FFA500 100%)'}}
            >
              <AiFillThunderbolt className="text-xl mr-2" /> Generate with AI
            </Button>

            {loading && (
              <div className="flex justify-center my-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon"></div>
              </div>
            )}

            {/* Display AI-generated Questions */}
            {generatedQuestions.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold">AI-Generated Questions</h3>
                <div className="space-y-2">
                  {generatedQuestions.map((question, index) => (
                    <div key={index} className="bg-gray-700 p-4 rounded-lg">
                      <div
                        className="flex justify-between cursor-pointer"
                        onClick={() => handleDropdownToggle(index)}
                      >
                        <h4 className="font-semibold">{question.question}</h4>
                        <span className="text-gray-400">
                          {selectedQuestionIndex === index ? "▲" : "▼"}
                        </span>
                      </div>
                      {selectedQuestionIndex === index && (
                        <div className="mt-2 text-gray-300">
                          {question.answer}
                        </div>
                      )}
                      <Button
                        type="button"
                        onClick={() => handlePickQuestion(question)}
                        className="mt-2 bg-blue-600 hover:bg-blue-700 rounded px-4 py-2 text-white hover:border-blue-700 hover:text-gray-200 hover:bg-transparent  " 
                      >
                        Select
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700">
              Submit
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessDetails;
