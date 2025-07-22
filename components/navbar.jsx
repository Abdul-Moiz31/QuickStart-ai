"use client";
import React, { useState, useEffect } from "react";
import { Button } from "components/ui/button";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { FaUpwork } from "react-icons/fa6";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const { isLoggedOut, loading, user } = useSelector((state) => state.user);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll function
  const handleSmoothScroll = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
    setIsOpen(false); // Close mobile menu after navigation
  };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/80 backdrop-blur-md shadow-lg border-b border-purple-100' 
        : 'bg-white shadow-md border-b-4 border-transparent rounded-b-lg border-gradient-purple'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex-shrink-0 flex items-center">
            <Image
              src="/file.png"
              alt="QuickStart"
              width={70}
              height={70}
              className="cursor-pointer transition-transform hover:scale-110"
              onClick={() => router.push("/")}
            />
            <span className="ml-1 text-3xl font-bold text-purple-600 transition-colors hover:text-purple-700">
              QuickStart
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
            <button
              onClick={() => handleSmoothScroll('about')}
              className="border-transparent text-gray-700 hover:border-purple-500 hover:text-purple-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200 hover:scale-105"
            >
              ABOUT
            </button>
            <button
              onClick={() => handleSmoothScroll('features')}
              className="border-transparent text-gray-700 hover:border-purple-500 hover:text-purple-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200 hover:scale-105"
            >
              FEATURES
            </button>
            <button
              onClick={() => handleSmoothScroll('pricing')}
              className="border-transparent text-gray-700 hover:border-purple-500 hover:text-purple-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200 hover:scale-105"
            >
              PRICING
            </button>
            <button
              onClick={() => handleSmoothScroll('faq')}
              className="border-transparent text-gray-700 hover:border-purple-500 hover:text-purple-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200 hover:scale-105"
            >
              FAQ
            </button>

            {/* Tools Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="border-transparent text-gray-700 hover:border-purple-500 hover:text-purple-600 inline-flex items-center px-1  border-b-2 text-sm font-medium  h-[100%] pt-3 shadow-none transition-all duration-200 hover:scale-105">
                  Tools
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-white shadow-lg rounded-lg border border-gray-200 w-64 mt-2 p-2"
              >
                <DropdownMenuItem
                  
                  className="flex  items-center px-3 py-2 text-sm text-purple-500 rounded-md hover:bg-purple-500 hover:text-purple-600 cursor-pointer font-semibold focus:text-purple-600 
                  "
                  onClick={() => router.push("/proposal-writer")}
                >
                  
                  <FaUpwork className="text-2xl mt-1"/>
                  Upwork Proposal Writer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <a
              href="https://www.npmjs.com/package/@quickstart-ai/chatbot"
              className="border-transparent text-gray-700 hover:border-purple-500 hover:text-purple-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200 hover:scale-105"
            >
              DOCS
            </a>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <button
              onClick={() => handleSmoothScroll('contact')}
              className=" text-purple-600 hover:bg-gradient-purple-100 rounded-full transition-all ease-in-out duration-300 hover:scale-105"
            >
              CONTACT US
            </button>
            {/* Display the proper button based on login status */}
            {loading ? (
              <div className="ml-2 w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : user ? (
              <Button
                onClick={() => router.push("/user")}
                className="ml-2 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 text-white hover:bg-gradient-to-l rounded-full transition-all ease-in-out duration-300 hover:scale-105 hover:shadow-lg"
              >
                DASHBOARD
              </Button>
            ) : (
              <Button
                onClick={() => router.push("/start")}
                className="ml-2 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 text-white hover:bg-gradient-to-l rounded-full transition-all ease-in-out duration-300 hover:scale-105 hover:shadow-lg"
              >
                JOIN US
              </Button>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex sm:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-800 focus:outline-none transition-colors hover:bg-purple-50"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="sm:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button
                onClick={() => handleSmoothScroll('about')}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 w-full text-left transition-colors"
              >
                ABOUT
              </button>
              <button
                onClick={() => handleSmoothScroll('features')}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 w-full text-left transition-colors"
              >
                FEATURES
              </button>
              <button
                onClick={() => handleSmoothScroll('pricing')}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 w-full text-left transition-colors"
              >
                PRICING
              </button>
              <button
                onClick={() => handleSmoothScroll('faq')}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 w-full text-left transition-colors"
              >
                FAQ
              </button>
              <a
                href="https://www.npmjs.com/package/@quickstart-ai/chatbot"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600"
              >
                DOCS
              </a>

              {/* Mobile Buttons */}
              <div className="mt-4 space-y-1">
                <button
                  onClick={() => handleSmoothScroll('contact')}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 w-full text-left transition-colors"
                >
                  CONTACT US
                </button>
                {loading ? (
                  <div className="w-full h-8 rounded-full bg-gray-200 animate-pulse"></div>
                ) : user ? (
                  <Button
                    onClick={() => router.push("/user")}
                    className="w-full bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 text-white hover:bg-gradient-to-l rounded-full transition-all ease-in-out duration-300"
                  >
                    DASHBOARD
                  </Button>
                ) : (
                  <Button
                    onClick={() => router.push("/start")}
                    className="w-full bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 text-white hover:bg-gradient-to-l rounded-full transition-all ease-in-out duration-300"
                  >
                    JOIN US
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
