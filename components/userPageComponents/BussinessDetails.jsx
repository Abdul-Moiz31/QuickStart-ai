import React, { useState, useEffect } from "react";
import { MdDeleteOutline, MdInfoOutline } from "react-icons/md";
import { FaRobot, FaCommentDots, FaBolt } from "react-icons/fa";
import {
  List,
  LayoutGrid,
  ArrowDown,
  ArrowDown01,
  ArrowDownIcon,
  ArrowDownToDot,
  ArrowUpDown,
  ChevronDown,
  DeleteIcon,
  Delete,
  Trash2,
} from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyD53FP_NKO8bhiwvklbyu76mtNzwgdnESY");
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: { responseMimeType: "application/json" },
});

import { Card, CardHeader, CardTitle, CardContent } from "components/ui/card";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Textarea } from "components/ui/textarea";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "components/ui/alert-dialog";
import { useDispatch, useSelector } from "react-redux";
import {
  addBusinessDetails,
  deleteBusinessDetails,
  loadUser,
  clearState,
  getBussinessDetails,
} from "@/slices/userSlice";
import toast from "react-hot-toast";
import { AiFillThunderbolt } from "react-icons/ai";
import { systemPrompt } from "./prompt";
import Loader from "../Loader";

const BusinessDetails = () => {
  const dispatch = useDispatch();
  const [layout, setLayout] = useState("carousel");
  const { isBusinessDetailsAdded, isBusinessDetailsDeleted, user, error } =
    useSelector((state) => state.user);

  const [formData, setFormData] = useState({
    question: "",
    answer: "",
  });
  const [loading, setLoading] = useState(false);

  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleDelete = async (id) => {
    setLoading(true);
    dispatch(deleteBusinessDetails(id));

    await loadUser();
    setLoading(false);
    toast.success("Business detail deleted successfully");
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!formData.question || !formData.answer) {
      toast.error("Please fill all the fields");
      setLoading(false);
      return;
    }
    await dispatch(addBusinessDetails(formData));
    setLoading(false);
    setFormData({
      question: "",
      answer: "",
    });
    toast.success("Business detail added successfully");
  };

  const handleGenerateAI = async () => {
    setLoading(true);
    const businessDetails = `
      Business Name: ${user.bussinessName || "N/A"},
      Business Category: ${user.bussinessCategory || "N/A"},
      Business Description: ${user.bussinessDescription || "N/A"},

      return an array of questions containing the object of question and answer
    `;

    const prompt = `
      Generate AI questions for the following business details from user perspective (end users) which a user can ask from a chatbot contains the details of business: ${businessDetails}.
    `;

    try {
      const result = await model.generateContent(prompt);
      const questions = JSON.parse(
        result.response.candidates[0].content.parts[0].text
      );
      setGeneratedQuestions(questions);
    } catch (error) {
      console.error("Error generating AI questions:", error);
      toast.error("An error occurred while generating AI questions.");
    }

    setLoading(false);
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

  const handleToggleLayout = (selectedLayout) => {
    setLayout(selectedLayout);
  };

  useEffect(() => {
    if (isBusinessDetailsAdded || isBusinessDetailsDeleted) {
      dispatch(loadUser());
      dispatch(clearState());
    }
  }, [isBusinessDetailsAdded, isBusinessDetailsDeleted, dispatch]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen text-gray-700">
      <div className="bg-white w-full max-w-4xl  rounded-xl shadow-xl relative z-10 transform transition-transform">
        <CardHeader className="flex justify-between p-6">
          <CardTitle className="text-2xl  font-semibold text-black-500">
            Company Details
          </CardTitle>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="p-2 text-black hover:text-gray-400 transition-all">
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
                  <li>
                    Enter business-related questions in the "Question" field.
                  </li>
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
          <form className="space-y-6" onSubmit={(e) => handleSubmit(e)}>
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
                  className="mt-2 block w-full border border-gray-200 bg-white text-gray-900 placeholder-[#9e45f1] focus:ring focus:ring-blue-500"
                />
                <FaRobot className="absolute right-3 top-3 text-xl text-[#9e45f1]" />
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
                  className="mt-2 block w-full border border-gray-200 bg-white text-gray-900 placeholder-[#9e45f1]  "
                />
                <FaCommentDots className="absolute right-3 top-3 text-xl text-[#9e45f1]" />
              </div>
            </div>

            {/* Generate with AI Button */}
            <Button
              type="button"
              onClick={handleGenerateAI}
              className="w-full py-3 text-lg font-semibold bg-neon transition-all relative text-white bg-purple-600"
              style={{
                background: "linear-gradient(90deg, #FF00FF 0%, #FFA500 100%)",
              }}
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
                <h3 className="text-lg font-semibold">
                  AI-Generated Questions
                </h3>
                <div className="space-y-2">
                  {generatedQuestions.map((question, index) => (
                    <div
                      key={index}
                      className="bg-white shadow-xl p-4 rounded-lg"
                    >
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
                        className="mt-2 bg-[#9e45f1] hover:bg-[#6c2794] rounded-xl text-white  "
                      >
                        Select
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full py-3 text-lg font-semibold bg-[#9e45f1] hover:bg-[#6c2794]  text-white"
            >
              Submit
            </Button>
          </form>
        </CardContent>
      </div>

      {/* Floating Carousel */}
      <div className="w-full max-w-4xl mt-8">
        <div className="p-4">
          {/* Layout Toggle Icons */}
          <div className="flex justify-end mb-4 space-x-4">
            <LayoutGrid
              onClick={() => handleToggleLayout("carousel")}
              className={`cursor-pointer text-gray-500 hover:text-blue-500 transition ${
                layout === "carousel" ? "text-blue-500" : ""
              }`}
              size={24}
            />
            <List
              onClick={() => handleToggleLayout("accordion")}
              className={`cursor-pointer text-gray-500 hover:text-blue-500 transition ${
                layout === "accordion" ? "text-blue-500" : ""
              }`}
              size={24}
            />
          </div>

          {/* Conditionally render based on selected layout */}
          {layout === "carousel" ? (
            <div className="w-full max-w-4xl mt-8">
              <Carousel
                plugins={[
                  Autoplay({
                    delay: 3000,
                  }),
                ]}
                className=" rounded-xl shadow-xl overflow-hidden relative  "
              >
                <CarouselContent>
                  {user?.bussinessDetails?.map((item, index) => (
                    <CarouselItem key={index}>
                      <div className="relative p-6 bg-white text-gray-800 rounded-xl  transition-transform transform hover:scale-105 max-h-[35vh] min-h-[35vh]">
                        <div className="h-full relative group ">
                          <CardHeader className="flex flex-row align-middle gap-3">
                            <FaRobot className="text-2xl text-[#9e45f1]" />
                            <CardTitle className="text-lg">
                              {item.question}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-2">
                            <p>{item.answer}</p>
                          </CardContent>
                          <div className="absolute top-3 right-3">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button className="p-2 text-red-400 hover:text-red-200 transition-all">
                                  <MdDeleteOutline className="text-2xl" />
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-gray-900 text-white rounded-lg p-6">
                                <AlertDialogTitle className="text-lg font-semibold mb-2">
                                  Delete Confirmation
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this detail?
                                </AlertDialogDescription>
                                <div className="mt-4 flex justify-end space-x-2">
                                  <AlertDialogCancel className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                                    <span
                                      onClick={() => handleDelete(item._id)}
                                    >
                                      Delete
                                    </span>
                                  </AlertDialogAction>
                                </div>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          ) : (
            <div className="accordion space-y-4">
              {user?.bussinessDetails.map((detail, index) => (
                <div key={index} className="border rounded-lg">
                  <div
                    onClick={() => {
                      const panel = document.getElementById(`panel-${index}`);
                      panel.classList.toggle("hidden");
                    }}
                    className="flex px-4 py-2 bg-gray-50 rounded-t-lg hover:bg-gray-100 cursor-pointer"
                  >
                    <button className="w-full text-left ">
                      {detail.question}
                    </button>
                    <span className="flex gap-4">

                    <ChevronDown />
                    <Trash2 onClick={() => handleDelete(detail._id)} color="red" className="z-50" />
                    </span>
                  </div>
                  <div
                    id={`panel-${index}`}
                    className="px-4 py-2 bg-gray-50 hidden rounded-b-lg border-t-2"
                  >
                    <p>{detail.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessDetails;
