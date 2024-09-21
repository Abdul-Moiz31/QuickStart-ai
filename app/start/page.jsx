"use client";
import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, Mail, User, Building } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { signUp, login, clearState } from "@/slices/userSlice";

export default function UserAuth() {
  const dispatch = useDispatch();
  const { isUserRegistered, isUserLogged, loading, error } = useSelector(
    (state) => state.user
  );
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // For controlling step-based form for signup
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    bussinessName: "",
    bussinessDescription: "",
    bussinessCategory: "",
  });

  const toggleAuthMode = () => setIsSignUp(!isSignUp);
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle form submission for login and signup
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSignUp && step === 1) {
      // Move to next step if step 1
      setStep(2);
    } else if (isSignUp) {
      // If on step 2, complete signup process
      dispatch(signUp(formData));
    } else {
      // Perform login
      dispatch(login({ email: formData.email, password: formData.password }));
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-gray-900 p-8 rounded-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            {isSignUp ? "Create your account" : "Sign in to your account"}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <input type="hidden" name="remember" value="true" />

          {/* Step 1 for Sign Up */}
          {isSignUp && step === 1 && (
            <>
              <div>
                <label htmlFor="name" className="sr-only">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="appearance-none rounded-none relative block w-full pl-10 px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Full Name"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="appearance-none rounded-none relative block w-full pl-10 px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Email address"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="appearance-none rounded-none relative block w-full pl-10 px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Step 2 for Sign Up */}
          {isSignUp && step === 2 && (
            <>
              <div>
                <label htmlFor="bussinessName" className="sr-only">
                  Company Name
                </label>
                <div className="relative">
                  <input
                    id="bussinessName"
                    name="bussinessName"
                    type="text"
                    value={formData.bussinessName}
                    onChange={handleInputChange}
                    required
                    className="appearance-none rounded-none relative block w-full pl-10 px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Company Name"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="bussinessDescription" className="sr-only">
                  Company Description
                </label>
                <div className="relative">
                  <input
                    id="bussinessDescription"
                    name="bussinessDescription"
                    type="text"
                    value={formData.bussinessDescription}
                    onChange={handleInputChange}
                    required
                    className="appearance-none rounded-none relative block w-full pl-10 px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Company Description"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="bussinessCategory" className="sr-only">
                  Business Category
                </label>
                <div className="relative">
                  <input
                    id="bussinessCategory"
                    name="bussinessCategory"
                    type="text"
                    value={formData.bussinessCategory}
                    onChange={handleInputChange}
                    required
                    className="appearance-none rounded-none relative block w-full pl-10 px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Business Category"
                  />
                </div>
              </div>
            </>
          )}

          {/* Shared for Login and Signup */}
          {!isSignUp && (
            <>
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="appearance-none rounded-none relative block w-full pl-10 px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Email address"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="appearance-none rounded-none relative block w-full pl-10 px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-300"
              >
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isSignUp ? (step === 1 ? "Next" : "Sign Up") : "Sign In"}
            </button>
          </div>
        </form>

        <div className="text-center">
          <button
            onClick={toggleAuthMode}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            {isSignUp
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
