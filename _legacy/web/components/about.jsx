"use client";

import { motion } from "framer-motion";
import { Button } from "@nextui-org/button";

export default function About() {
  return (
    <div className="my-10 relative flex justify-center items-center bg-white text-gray-800">
      <section
        id="about"
        className="max-w-screen-xl mx-auto px-4  gap-20 md:px-8 flex flex-col md:flex-row items-center"
      >
        {/* Right section: Text with animation and better content */}
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="flex flex-col justify-center items-center md:items-start space-y-6 max-w-lg mx-auto text-center md:text-left flex-1"
        >
          {/* Heading */}
          <h2 className="text-4xl font-semibold tracking-tight md:text-5xl text-gray-700">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 text-transparent bg-clip-text">
              QuickStart AI
            </span>
          </h2>

          {/* Subheading with a more engaging message */}
          <div className="flex justify-center items-center text-left mb-4">
            <p className="text-lg contain-content text-gray-600 md:text-xl">
              Revolutionize your customer support with our AI-powered live chat
              solution. QuickStart AI automates real-time interactions, ensuring
              customers get instant, personalized assistance—no agents required!
            </p>
          </div>

          {/* Highlight points */}
          <ul className="text-gray-600 space-y-2 list-disc list-inside w-full text-left pl-6">
            <li>
              Seamlessly integrates with any website through our simple npm
              package.
            </li>
            <li>Empowers businesses to provide 24/7 customer support.</li>
            <li>
              Manage interactions and track customer engagement from a
              personalized dashboard.
            </li>
            <li>
              Enhances customer satisfaction and reduces response time to
              seconds.
            </li>
          </ul>

          {/* Call to action with better styling */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-8"
          >
            <Button
              className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 hover:bg-gradient-to-l text-white px-8 py-3 rounded-full text-lg transition duration-300 shadow-lg hover:shadow-xl"
            >
              Explore More
            </Button>
          </motion.div>
        </motion.div>

        {/* Left section: Image with smooth fade-in */}

        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="mt-12 md:mt-0  flex-1"
        >
          <img
            src="/fea3.png"
            alt="AI-Powered Chat Solution"
            className="rounded-lg  transform hover:scale-105 transition duration-500 ease-in-out"
          />
        </motion.div>
      </section>
    </div>
  );
}
