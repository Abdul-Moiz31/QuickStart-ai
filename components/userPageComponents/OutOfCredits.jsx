import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
// next-navigation
import { redirect } from "next/navigation";

const OutOfCredits = ({ onClose }) => {


  return (
    <>

    <div className="bg-800-black">

    <motion.div
      initial={{ opacity: 0, scale: 1 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-60"
    >
      <div className="relative bg-white text-black rounded-lg p-8 shadow-xl max-w-sm text-center">
        {/* Close Icon */}
        <button
          onClick={()=>onClose(false)}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Emoji and Message */}
        <div className="text-6xl mb-4">😓</div>
        <h2 className="text-2xl font-bold mb-2">Out of Credits</h2>
        <p className="mb-4">
          Oops! It looks like you've run out of credits. Please add more credits to continue using our services.
        </p>

        {/* Add Credits Button */}
        <button
          className="bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700 transition-colors"
          onClick={() =>  
          
            redirect("/#pricing") // {redirect} is a function from next/navigation
          } // Navigate to /#pricing
        >
          Add Credits
        </button>
      </div>
    </motion.div>
    </div>
    </>
  );
};

export default OutOfCredits;
