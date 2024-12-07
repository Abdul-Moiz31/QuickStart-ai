'use client'

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Briefcase, User, FileText, Copy, X } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"
import Navbar from "@/components/navbar"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { prompt } from "./prompt"


const genAI = new GoogleGenerativeAI("AIzaSyAAUKB6qgTIonRWHEyFQ2hNgGz7syXDunQ");


export default function ProposalWriter() {
  const [jobDescription, setJobDescription] = useState("")
  const [profileDescription, setProfileDescription] = useState("")
  const [generatedProposal, setGeneratedProposal] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const generateProposal = async() => {

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const result = await model.generateContent({
          contents: [
            {
                role: "user",
                parts: [
                    {text:prompt},
                    {text:"Job Decsription: "},
                  { text: jobDescription },
                  { text: "Profile Description: " },
                  { text: profileDescription },
                ],
            },
            ],                
        });

        setGeneratedProposal(result.response.candidates[0].content.parts[0].text);
    } catch (error) {
        console.error(error);
    }



    console.log("Generating proposal..." )
    setIsModalOpen(true)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedProposal)
    alert("Proposal copied to clipboard!")
  }

  const steps = [
    { title: "Job Description", icon: <Briefcase className="w-6 h-6" /> },
    { title: "Your Profile", icon: <User className="w-6 h-6" /> },
    { title: "Generate", icon: <FileText className="w-6 h-6" /> },
  ]

  return (
    <>
    <Navbar/>
    <div className="min-h-screen bg-white ">
      <div className="mx-auto p-8 bg-gradient-to-br from-purple-50 via-white to-purple-70 rounded-lg shadow-lg pt-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl font-bold text-purple-700">
            Proposal Writer
          </h2>
        </div>

        <Tabs defaultValue="write" className="mb-8 min-h-screen">
          {/* <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="write"
            className="text-center text-lg font-semibold text-black-600 hover:text-purple-700 focus:text-purple-800 
            data-[state=active]:text-purple-800
            ">Write Proposal</TabsTrigger>   
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList> */}
          <TabsContent value="write">
            <Card>
              <CardHeader>
                <CardTitle className="text-purple-800">Create Your Proposal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-8">
                  {steps.map((step, index) => (
                    <div
                      key={index}
                      className={`flex flex-col items-center cursor-pointer ${
                        index <= currentStep ? 'text-purple-600' : 'text-gray-400'
                      }`}
                      onClick={() => setCurrentStep(index)}
                    >
                      <div className="rounded-full p-2 bg-purple-100 mb-2">
                        {step.icon}
                      </div>
                      <span className="text-sm">{step.title}</span>
                    </div>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {currentStep === 0 && (
                    <motion.div
                      key="job-description"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="mb-6">
                        <label className="block text-lg font-medium text-gray-700 mb-2">
                          Job Description
                        </label>
                        <Textarea
                          placeholder="Enter the job description"
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          className="border-2 border-purple-300 focus:ring focus:ring-purple-100 rounded-md text-black"
                          rows={8}

                        />
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 1 && (
                    <motion.div
                      key="profile-description"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="mb-6">
                        <label className="block text-lg font-medium text-gray-700 mb-2">
                          Profile Description (Optional)
                        </label>
                        <Textarea
                          placeholder="Enter your profile description"
                          value={profileDescription}
                          onChange={(e) => setProfileDescription(e.target.value)}
                          className="border-2 border-purple-300 focus:ring focus:ring-purple-100 rounded-md text-black"
                          rows={8}
                        />
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div
                      key="generate"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="text-center"
                    >
                      <Button
                        onClick={generateProposal}
                        className="px-6 py-3 text-white bg-purple-600 hover:bg-purple-700 rounded-md shadow-md text-lg font-semibold transition-colors duration-300"
                      >
                        Generate Proposal
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-between mt-8">
                  <Button
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    className="px-4 py-2 text-purple-600 bg-purple-100 hover:bg-purple-200 rounded-md transition-colors duration-300"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(Math.min(2, currentStep + 1))}
                    disabled={currentStep === 2}
                    className="px-4 py-2 text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors duration-300"
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Proposal History</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Your previous proposals will appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="rounded-lg bg-white shadow-xl max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-purple-700 text-2xl">Generated Proposal</DialogTitle>
            </DialogHeader>
            <Textarea
              className="w-full mt-4 p-4 border border-gray-300 rounded-md bg-gray-50 text-gray-800"
              rows={10}
              value={generatedProposal}
              readOnly
            />
            <div className="flex justify-between mt-6">
              <Button
                onClick={copyToClipboard}
                className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 transition-colors duration-300 flex items-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>Copy to Clipboard</span>
              </Button>
              <Button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors duration-300 flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    </>

  )
}
