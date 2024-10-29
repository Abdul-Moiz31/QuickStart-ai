'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, Zap, Eye } from 'lucide-react'

const PricingSection = () => {
  const [isAnnual, setIsAnnual] = useState(false)
  const router = useRouter();

  const plans = [
    {
      name: 'Basic plan',
      price: 0,
      icon: Zap,
      features: [
        '200 free credits',
        'Scalability',
        'Real-time customer support',
        'Basic chat widget customization',
        'Data security',

      ],
    },
    {
      name: 'Business plan',
      price: 10,
      icon: Eye,
      features: [
        '500 credits per month',
        'Real-time customer support',
        'Customizable chat widget',
        'Access to interaction analytics',
        'Data security',
      ],
      bestValue: true,
    },
    {
      name: 'Enterprise plan',
      price: 20,
      icon: Check,
      features: [
        'Unlimited credits',
        'Real-time customer support',
        'Advanced chat widget customization',
        'Interaction analytics and reporting',
        'Priority customer support',
        'Data security and compliance',
      ],
    },
  ]
  const scrollToContact = () => {
    const contactSection = document.getElementById('contact')
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <motion.div
      className="text-black max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, delay: 0.3 }}
    >
      {/* Pricing Section Title with Matching Style */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.3 }}
        className="flex flex-col gap-3 justify-center items-center mb-8"
      >
        <h4 className="text-3xl font-bold sm:text-4xl bg-gradient-to-b from-purple-500 via-purple-600 to-purple-700 bg-clip-text text-transparent">
          Pricing
        </h4>
        <p className="max-w-xl text-gray-500 text-center">
          Choose the plan that fits your business needs and scale easily with our flexible options.
        </p>
      </motion.div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="relative bg-gray-100 rounded-full p-1">
          <button
            className={`px-4 py-2 rounded-full ${
              !isAnnual ? 'bg-white shadow-sm' : ''
            }`}
            onClick={() => setIsAnnual(false)}
          >
            Monthly billing
          </button>
          <button
            className={`px-4 py-2 rounded-full ${
              isAnnual ? 'bg-white shadow-sm' : ''
            }`}
            onClick={() => setIsAnnual(true)}
          >
            Annual billing
          </button>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            className={`rounded-lg p-6 shadow-lg transition-all duration-500 ${
              plan.bestValue
                ? 'bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white shadow-purple-500/40'
                : 'bg-white shadow-md'
            }`}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <plan.icon className="w-8 h-8 mb-4" />
            <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
            <div className="text-3xl font-bold mb-4">
              ${plan.price}
              <span className="text-base font-normal">/month</span>
            </div>
            <p className="text-sm mb-4">Billed annually.</p>
            <div className="flex items-center justify-between mb-4">
              {/* <button className="px-3 py-1 bg-gray-200 rounded-full text-black">-</button> */}
              <span>1 USER</span>
              {/* <button className="text-black px-3 py-1 bg-gray-200 rounded-full">+</button> */}
            </div>
            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center">
                  <Check className="w-5 h-5 mr-2" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              className={`w-full py-2 rounded-full transition duration-300 ease-in-out ${
                plan.bestValue
                  ? 'bg-white text-purple-600'
                  : 'bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white'
              }`}
              onClick={scrollToContact} 
            >
              Get started
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export default PricingSection
