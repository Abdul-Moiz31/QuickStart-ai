import React, { useState } from "react";
import { MdDeleteOutline, MdInfoOutline } from "react-icons/md";
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
} from "@/components/ui/carousel"; // Assuming Shadcn carousel component
import Autoplay from "embla-carousel-autoplay";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"; // Shadcn alert-dialog component

const BussinessDetails = () => {
  const [details, setDetails] = useState([
    {
      question: "🚀 What is our Company Objective?",
      answer:
        "Our objective is to provide the best services to our customers and to continuously improve our offerings. 💼",
    },
    {
      question: "🎯 What is our Company Mission?",
      answer:
        "Our mission is to deliver quality service and create lasting customer relationships. 🤝",
    },
    {
      question: "🌟 What is our Company Vision?",
      answer:
        "Our vision is to be the leading provider of innovative solutions in our industry. 🏆",
    },
  ]);

  // Function to remove a card from the carousel
  const handleDelete = (index) => {
    setDetails((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="relative px-4 lg:px-10 py-6 bg-gray-900 min-h-screen flex flex-col items-center">

      {/* Form Section */}
      <Card className="bg-gray-800 w-full max-w-4xl text-white shadow-lg">
        <CardHeader className="flex justify-between items-center px-6 py-4">
          <CardTitle className="text-2xl font-semibold">
            Company Details
          </CardTitle>

          {/* Information Button with Alert Dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white transition duration-200">
                <MdInfoOutline className="text-xl" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-gray-900 text-white rounded-lg p-6 shadow-xl">
              <AlertDialogTitle className="text-xl font-semibold mb-2">
                How to Provide Business Details
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                <p className="mb-4">
                  To help us train our models effectively, please provide
                  detailed answers to the following:
                </p>
                <ul className="list-disc pl-5 mb-4">
                  <li>
                    Enter the questions related to your business in the "Company
                    Related Question" field.
                  </li>
                  <li>
                    Provide comprehensive answers in the "Answer" field.
                  </li>
                  <li>
                    Ensure all fields are filled so the model can learn from it.
                  </li>
                </ul>
                <p>
                  This information helps train our models to provide more
                  accurate responses.
                </p>
              </AlertDialogDescription>
              <div className="mt-4 flex justify-end">
                <AlertDialogCancel className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                  Close
                </AlertDialogCancel>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </CardHeader>

        <CardContent className="px-6 py-4">
          <form className="space-y-6">
            <div>
              <label
                htmlFor="question"
                className="block text-sm font-medium text-gray-400"
              >
                Company Related Question
              </label>
              <Input
                id="question"
                type="text"
                placeholder="What is our Company Objective? 🚀"
                className="mt-2 w-full bg-gray-900 text-white border border-gray-600 placeholder-gray-500 rounded-lg"
              />
            </div>

            <div>
              <label
                htmlFor="answer"
                className="block text-sm font-medium text-gray-400"
              >
                Answer
              </label>
              <Textarea
                id="answer"
                placeholder="Our objective is to provide the best services... 💼"
                rows={4}
                className="mt-2 w-full bg-gray-900 text-white border border-gray-600 placeholder-gray-500 rounded-lg"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Add Detail
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Floating Carousel Section */}
      <div className="w-full max-w-4xl mt-10">
        <Carousel
          plugins={[
            Autoplay({
              delay: 2500,
              stopOnMouseEnter: true,
            }),
          ]}
          className="rounded-lg overflow-hidden shadow-lg"
        >
          <div className="bg-gray-700 p-4 text-white">
            <CarouselContent>
              {details.map((item, index) => (
                <CarouselItem key={index}>
                  <Card className="h-full relative group bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow">
                    <CardHeader className="px-4 py-2">
                      <CardTitle className="text-lg font-semibold text-gray-200">
                        {item.question}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 py-2 text-gray-300">
                      <p>{item.answer}</p>
                    </CardContent>

                    {/* Delete Icon - appears on hover */}
                    <MdDeleteOutline
                      onClick={() => handleDelete(index)}
                      className="absolute top-2 right-2 text-xl text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition duration-300 cursor-pointer"
                    />
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
          </div>
        </Carousel>
      </div>
    </div>
  );
};

export default BussinessDetails;
