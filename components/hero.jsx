"use client"
import React from 'react'
import { Button } from "@/components/ui/button"
import { ArrowRight, MapPin, Phone, Mail } from 'lucide-react'
import { motion } from 'framer-motion'

// Motion variants for smooth animation
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeInOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

export default function Hero() {
  return (
    <motion.div initial="hidden" animate="visible" className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div variants={staggerContainer} className="lg:flex lg:items-center lg:justify-between">
          {/* Left Side */}
          <motion.div variants={fadeInUp} className="lg:w-1/2">
            <motion.h1 variants={fadeInUp} className="text-2xl font-bold sm:text-3xl md:text-3xl bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 text-transparent bg-clip-text">
              Build, Train, and Manage Effortlessly 
              <motion.span variants={fadeInUp} className="block bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 text-transparent bg-clip-text">with QuickStart AI</motion.span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Create a superior chat experience for your website with QuickStart AI. Manage and train your data with ease.
            </motion.p>
            <motion.div variants={fadeInUp} className="mt-5 sm:mt-8">
              <Button className="inline-flex items-center justify-center px-5 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 hover:bg-gradient-to-l hover:scale-105 transition-transform">
                BUILD YOUR WORLD
                <ArrowRight className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Right Side with Image */}
          <motion.div variants={fadeInUp} className="mt-10 lg:mt-0 lg:w-1/2">
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "mirror",
              }}
              whileHover={{ scale: 1.05 }} 
              className="mt-12 md:mt-0 md:mr-8"
            >
              <img
                src="/aboutus.png"
                alt="Descriptive Alt Text"
              />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Contact Info Cards */}
        <motion.div variants={staggerContainer} className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1 */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            variants={fadeInUp}
            className="flex items-center p-6 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 rounded-3xl shadow-lg hover:bg-gradient-to-r hover:from-purple-500 hover:to-purple-700 transition-colors"
          >
            <MapPin className="h-6 w-6 text-gray-600 hover:text-white" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-700 hover:text-white">Pay Us a Visit</h3>
              <p className="mt-1 text-sm text-gray-500 hover:text-white">Union St, Seattle, WA 98101, United States</p>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            variants={fadeInUp}
            className="flex items-center p-6 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 rounded-3xl shadow-lg hover:bg-gradient-to-r hover:from-purple-500 hover:to-purple-700 transition-colors"
          >
            <Phone className="h-6 w-6 text-gray-600 hover:text-white" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-700 hover:text-white">Give Us a Call</h3>
              <p className="mt-1 text-sm text-gray-500 hover:text-white">(110) 1111-1010</p>
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            variants={fadeInUp}
            className="flex items-center p-6 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 rounded-3xl shadow-lg hover:bg-gradient-to-r hover:from-purple-500 hover:to-purple-700 transition-colors"
          >
            <Mail className="h-6 w-6 text-purple-600 hover:text-white" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-purple-700 hover:text-white">Send Us a Message</h3>
              <p className="mt-1 text-sm text-purple-500 hover:text-white">Contact@HydraVTech.com</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}
