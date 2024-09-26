"use client"
import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  return (
    <nav className="sticky top-0 z-50 bg-white  shadow-md border-b-4 border-transparent rounded-b-lg border-gradient-purple backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          <div className="flex-shrink-0 flex items-center">
            <svg className="h-8 w-8 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
            <span className="ml-2 text-2xl font-bold text-purple-600">QuickStart</span>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
            <a href="#" className="border-transparent text-gray-700 hover:border-purple-500 hover:text-purple-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
              ABOUT
            </a>
            <a href="#" className="border-transparent text-gray-700 hover:border-purple-500 hover:text-purple-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
              FEATURES
            </a>
            <a href="#" className="border-transparent text-gray-700 hover:border-purple-500 hover:text-purple-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
              PRICING
            </a>
            <a href="#" className="border-transparent text-gray-700 hover:border-purple-500 hover:text-purple-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
              FAQ
            </a>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <Button variant="outline" className="border-2 border-gradient-purple text-purple-600 hover:bg-gradient-purple-100 rounded-full transition-all ease-in-out duration-300">CONTACT US</Button>
            <Button className="ml-4 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 text-white hover:bg-gradient-to-l rounded-full transition-all ease-in-out duration-300">JOIN US</Button>
          </div>

          <div className="flex sm:hidden">
            <button onClick={toggleMenu} className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-800 focus:outline-none">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="sm:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600">
                ABOUT
              </a>
              <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600">
                Features
              </a>
              <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600">
                Pricing
              </a>
              <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600">
                FAQ
              </a>
              
              <div className="mt-4 space-y-1">
                <Button variant="outline" className="w-full border-2 border-gradient-purple text-purple-600 hover:bg-gradient-purple-100 rounded-full transition-all ease-in-out duration-300">CONTACT US</Button>
                <Button className="w-full bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 text-white hover:bg-gradient-to-l rounded-full transition-all ease-in-out duration-300">JOIN US</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
