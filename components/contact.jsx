'use client'
import React from 'react'
import { motion } from 'framer-motion'

export default function Component() {

  const inputClasses = "w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-full text-gray-800 focus:outline-none focus:border-purple-500"

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }} 
      animate={{ opacity: 1, scale: 1 }}  
      transition={{ duration: 0.5 }}       
      className="min-h-screen flex flex-col items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm p-4"
    >
      {/* Contact Us Heading outside the form box */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}   
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-4xl font-extrabold text-purple-600 mb-8"
      >
        Contact Us
      </motion.h1>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="w-full max-w-2xl bg-white bg-opacity-90 p-8 rounded-lg shadow-lg border-4 border-gradient-purple"
      >
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}    
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-bold text-center text-purple-600 mb-2"
        >
          JOIN QUICKSTART
        </motion.h1>
        <motion.p 
          initial={{ y: -20, opacity: 0 }}    
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-gray-600 mb-6"
        >
          Let's Build Your Own Chat Bot
        </motion.p>
        <form>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
              <input type="text" placeholder="First Name" className={inputClasses} />
            </motion.div>
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
              <input type="text" placeholder="Last Name" className={inputClasses} />
            </motion.div>
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.7 }}>
              <input type="email" placeholder="Email" className={inputClasses} />
            </motion.div>
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.7 }}>
              <input type="tel" placeholder="Phone Number" className={inputClasses} />
            </motion.div>
          </div>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="mb-4">
            <input type="text" placeholder="Subject" className={inputClasses} />
          </motion.div>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.9 }} className="mb-6">
            <textarea 
              placeholder="Tell Us Something..." 
              className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-2xl text-gray-800 focus:outline-none focus:border-purple-500 h-32 resize-none"
            ></textarea>
          </motion.div>
          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 1 }}
            className="flex justify-center"
          >
            <button 
              type="submit" 
              className="px-8 py-2 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 text-white rounded-full hover:bg-gradient-to-l focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-colors duration-300"
            >
              SEND 
            </button>
          </motion.div>
        </form>
      </motion.div>
    </motion.div>
  )
}
