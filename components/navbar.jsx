"use client";
import React, { useState } from "react";
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
  const router = useRouter();
  const { isLoggedOut, loading, user } = useSelector((state) => state.user);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md border-b-4 border-transparent rounded-b-lg border-gradient-purple backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex-shrink-0 flex items-center">
            <Image
              src="/file.png"
              alt="QuickStart"
              width={70}
              height={70}
              className="cursor-pointer"
              onClick={() => router.push("/")}
            />
            <span className="ml-1 text-3xl font-bold text-purple-600">
              QuickStart
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
            <a
              href="#about"
              className="border-transparent text-gray-700 hover:border-purple-500 hover:text-purple-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
            >
              ABOUT
            </a>
            <a
              href="#features"
              className="border-transparent text-gray-700 hover:border-purple-500 hover:text-purple-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
            >
              FEATURES
            </a>
            <a
              href="#pricing"
              className="border-transparent text-gray-700 hover:border-purple-500 hover:text-purple-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
            >
              PRICING
            </a>
            <a
              href="#faq"
              className="border-transparent text-gray-700 hover:border-purple-500 hover:text-purple-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
            >
              FAQ
            </a>

            {/* Tools Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="border-transparent text-gray-700 hover:border-purple-500 hover:text-purple-600 inline-flex items-center px-1  border-b-2 text-sm font-medium  h-[100%] pt-3 shadow-none ">
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
              className="border-transparent text-gray-700 hover:border-purple-500 hover:text-purple-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
            >
              DOCS
            </a>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <a
              href="#contact"
              className=" text-purple-600 hover:bg-gradient-purple-100 rounded-full transition-all ease-in-out duration-300"
            >
              CONTACT US
            </a>
            {/* Display the proper button based on login status */}
            {loading ? (
              <div className="ml-2 w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : user ? (
              <Button
                onClick={() => router.push("/user")}
                className="ml-2 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 text-white hover:bg-gradient-to-l rounded-full transition-all ease-in-out duration-300"
              >
                DASHBOARD
              </Button>
            ) : (
              <Button
                onClick={() => router.push("/start")}
                className="ml-2 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 text-white hover:bg-gradient-to-l rounded-full transition-all ease-in-out duration-300"
              >
                JOIN US
              </Button>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex sm:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-800 focus:outline-none"
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
              <a
                href="#about"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600"
              >
                ABOUT
              </a>
              <a
                href="#features"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600"
              >
                FEATURES
              </a>
              <a
                href="#pricing"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600"
              >
                PRICING
              </a>
              <a
                href="#faq"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600"
              >
                FAQ
              </a>
              <a
                href="https://www.npmjs.com/package/@quickstart-ai/chatbot"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600"
              >
                DOCS
              </a>

              {/* Mobile Buttons */}
              <div className="mt-4 space-y-1">
                <a
                  href="#contact"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                >
                  CONTACT US
                </a>
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
