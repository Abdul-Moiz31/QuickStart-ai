"use client"

import Image from 'next/image'
import { motion } from 'framer-motion'

export default function KeyBenefitsSection() {
  return (
    <motion.div
      className="bg-white text-black py-8 px-4 sm:px-6 lg:px-12 flex flex-col items-center gap-8 lg:gap-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="text-center">
        <div className="text-purple-700 text-sm font-semibold mb-2">
          Our Features
        </div>
        <h2 className="text-3xl font-bold sm:text-4xl bg-gradient-to-b from-purple-500 via-purple-600 to-purple-700 bg-clip-text text-transparent">
          Our Key Benefits
        </h2>
        <p className="text-gray-700 mb-6 text-sm sm:text-base">
          Our services are designed to cater to your specific needs and goals
        </p>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
        <div className="flex flex-col gap-8 w-full lg:w-1/2">
          {[  
            { title: "Tracking Time", description: "Seamlessly monitor and analyze essential business metrics with ease" },
            { title: "Data Report", description: "Seamlessly monitor and analyze essential business metrics with ease" }
          ].map((benefit, index) => (
            <motion.div 
              key={index}
              className="bg-gray-100 rounded-lg p-6 text-center shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <h3 className="text-lg font-bold bg-gradient-to-b from-purple-500 via-purple-600 to-purple-700 bg-clip-text text-transparent">
                {benefit.title}
              </h3>
              <p className="text-sm text-gray-600">{benefit.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="relative w-full h-[300px] lg:w-[500px] lg:h-[400px] mx-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <Image src="/fea8.png" alt="Dynamic Image" layout="fill" objectFit="contain" />
        </motion.div>

        <div className="flex flex-col gap-8 w-full lg:w-1/2">
          {[  
            { title: "Customer Support", description: "Seamlessly monitor and analyze essential business metrics with ease" },
            { title: "Modern Design", description: "Seamlessly monitor and analyze essential business metrics with ease" }
          ].map((benefit, index) => (
            <motion.div 
              key={index}
              className="bg-gray-100 rounded-lg p-6 text-center shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
              transition={{ delay: (index + 2) * 0.1, duration: 0.5 }}
            >
              <h3 className="text-lg font-bold bg-gradient-to-b from-purple-500 via-purple-600 to-purple-700 bg-clip-text text-transparent">
                {benefit.title}
              </h3>
              <p className="text-sm text-gray-600">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <p className="text-xl font-semibold text-center mt-8">
        “SaaSensation Ignites Your Productivity!”
      </p>
    </motion.div>
  )
}
