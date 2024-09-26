"use client";

import { motion } from "framer-motion";
import { Button } from "@nextui-org/button";

export default function About() {
  return (
    <div className="relative flex justify-center items-center bg-white text-[gray]">
      <section id="about" className="max-w-screen-xl mx-auto px-4 py-20 gap-12 md:px-8 flex flex-col md:flex-row justify-center items-center">
        
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="mt-12 md:mt-0 md:mr-8"
        >
          <img
            src="/fea3.png"
            alt="Descriptive Alt Text"
            className="rounded-lg"
            style={{ boxShadow: "none" }}
          />
        </motion.div>

        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="flex flex-col justify-center items-center md:items-start space-y-5 max-w-4xl mx-auto text-center md:text-left"
        >
          <h2 className="text-3xl font-light tracking-tighter mx-auto md:mx-0 md:text-5xl text-gray-500 bg-clip-text">
            Hola{" "}
            <span className="bg-gradient-to-t from-purple-500 via-purple-600 to-purple-700 text-transparent bg-clip-text border-none">
              Mates !
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-foreground/80 text-balance md:mx-0">
            Introducing QuickStart AI, a groundbreaking, AI-powered live chat solution designed to streamline customer 
            support for businesses! QuickStart AI integrates effortlessly with websites via a simple npm package, 
            enabling businesses to provide real-time chat support without the need for live agents. 
            With a personalized dashboard, business owners can manage chat systems, monitor interactions, 
            and track customer engagement efficiently.
          </p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-8"
          >
            <Button className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 text-white rounded-full transition duration-300">
              Learn More
            </Button>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
