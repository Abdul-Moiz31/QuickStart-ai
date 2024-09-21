import React, { useState } from "react";
import { MdDeleteOutline, MdInfoOutline } from "react-icons/md";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
    <div className="relative ">
      {/* Form Section */}
      <Card className="bg-gray-800 w-full text-white  relative z-10">
        <CardHeader className="w-full flex  justify-between ">
          <CardTitle className="text-xl font-bold">
            Company Details
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="p-2 text-gray-400 hover:text-gray-200">
                  <MdInfoOutline className="text-xl" />
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
                      Enter the questions related to your business in the
                      "Company Related Question" field.
                    </li>
                    <li>
                      Provide comprehensive answers in the "Answer" field.
                    </li>
                    <li>
                      Once you've added a question, make sure to fill in the
                      answer as well so the model can learn from it.
                    </li>
                  </ul>
                  <p className="mb-4">
                    This information will be used to train our models, ensuring
                    they can provide accurate and relevant responses based on
                    your business specifics.
                  </p>
                </AlertDialogDescription>
                <div className="mt-4 flex justify-end space-x-2">
                  <AlertDialogCancel className="inline-block bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
                    Close
                  </AlertDialogCancel>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </CardTitle>
          {/* Information Button */}
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div>
              <label
                htmlFor="question"
                className="block text-sm font-medium open-sans-headings "
              >
                Company Related Question
              </label>
              <Input
                id="question"
                type="text"
                placeholder="What is our Company Objective? 🚀"
                className="mt-1 block w-full border border-gray-500 bg-gray-900 text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="answer"
                className="block text-sm font-medium open-sans-headings"
              >
                Answer
              </label>
              <Textarea
                id="answer"
                placeholder="Our objective is to provide the best services to our customers... 💼"
                rows={4}
                className="mt-1 block w-full border border-gray-500 bg-gray-900 text-white placeholder-gray-500"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              Add Detail
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Floating Carousel on top of the form */}
      <div className="w-full mt-8">
        <Carousel
          plugins={[
            Autoplay({
              delay: 2500,
            }),
          ]}
          className="h-[200px] rounded-lg overflow-hidden relative"
        >
          <div className="bg-gray-700 p-4 text-white">
            <CarouselContent>
              {details.map((item, index) => (
                <CarouselItem key={index}>
                  <div className="relative text-white">
                    <Card className="h-full relative group">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {item.question}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-300">{item.answer}</p>
                      </CardContent>

                      {/* Delete Icon - appears on hover */}
                      <MdDeleteOutline
                        onClick={() => handleDelete(index)}
                        className="absolute top-2 right-2 text-xl text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition duration-300 cursor-pointer"
                      />
                    </Card>
                  </div>
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
