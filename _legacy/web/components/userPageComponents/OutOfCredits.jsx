import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { redirect } from "next/navigation";

const OutOfCredits = ({ onClose,setActiveTab }) => {

  const handleClose = () => {
    onClose();
    setActiveTab("business details")
  }


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
          onClick={()=>onClose()}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Emoji and Message */}
        <div className="text-6xl mb-4">😓</div>
        <h2 className="text-2xl font-bold mb-2">Business details not sufficient </h2>
        <p className="mb-4">
          Oops! It looks like your bussiness details are less than five. Details must be five or more than five
        </p>

        {/* Add Credits Button */}
        <button
          className="bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700 transition-colors"
          onClick={()=>handleClose()} 
        >
          Add Details
        </button>
      </div>
    </motion.div>
    </div>
    </>
  );
};

export default OutOfCredits;
