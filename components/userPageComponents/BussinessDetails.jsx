import React from "react";
import { MdDeleteOutline } from "react-icons/md";

const BussinessDetails = () => {
  const bussinessDetails = [
    {
      question: "What is our Company Objective?",
      answer:
        "Our objective is to provide the best services to our customers and to continuously improve our offerings.",
    },
    {
      question: "What is our Company Mission?",
      answer:
        "Our mission is to deliver quality service and create lasting customer relationships.",
    },
    {
      question: "What is our Company Vision?",
      answer:
        "Our vision is to be the leading provider of innovative solutions in our industry.",
    },

  ];
  return (
    <div>
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4">Company Details</h3>
        <form className="space-y-4">
          <div>
            <label
              htmlFor="Add company related question"
              className="block text-sm font-medium text-gray-400"
            >
              Company Related Question
            </label>
            <input
              id="Question"
              type="text"
              placeholder="What is our Company Objectives?"
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-400"
            >
              Answer
            </label>
            <textarea
              id="answer"
              placeholder="Our Objectives are to provide the best services to our customers..."
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white"
              rows={4}
            ></textarea>
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Add Detail
          </button>
        </form>

        {/* Cards for Questions and Answers */}
     
      </div>
      <div className="mt-6 space-y-4">
          {bussinessDetails.map((item, index) => (
            <div key={index} className="bg-gray-700 p-4 rounded-lg relative">
              <button className="absolute text-xl font-bold top-3 right-3 text-red-500 hover:text-red-700 ">
                <MdDeleteOutline color="red" size={22} />
              </button>
              <h4 className="text-lg font-bold text-white">{item.question}</h4>
              <p className="text-gray-300 mt-2">{item.answer}</p>
            </div>
          ))}
        </div>
    </div>
  );
};

export default BussinessDetails;
