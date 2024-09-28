"use client"
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowLeft, Briefcase, Building, Clipboard, Eye, EyeOff, User, Upload } from "lucide-react"; // Import the Upload icon
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../Firebase/firebase"; // Import Firebase storage

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    bussinessName: "",
    bussinessDescription: "",
    bussinessCategory: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [file, setFile] = useState(null); // File state for image upload
  const [profileImageUrl, setProfileImageUrl] = useState("");

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    // Create a preview URL for the uploaded image
    if (selectedFile) {
      const previewUrl = URL.createObjectURL(selectedFile);
      setProfileImageUrl(previewUrl);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (file) {
        // Create a storage reference for the image
        const storageRef = ref(storage, `profilePictures/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // Track upload progress if necessary
          },
          (error) => {
            console.error("Upload failed:", error);
          },
          () => {
            // Get the download URL once upload completes
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              setProfileImageUrl(downloadURL);
              console.log("File available at", downloadURL);
            });
          }
        );
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    }

    setLoading(false);
  };

  return (
    <div className="text-black min-h-screen flex items-center justify-center bg-gradient-to-r bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-5 left-5">
        <button className="flex items-center" onClick={() => window.location.href = "/"}>
          <ArrowLeft className="mr-2 h-8 w-8 text-purple-600 font-extrabold " />
        </button>
      </div>

      <div className="max-w-md w-full space-y-8 shadow-xl">
        <div className="text-center">
          <img src="/file.png" alt="Site Logo" className="h-20 w-auto mx-auto" />
          <h2 className="mt-6 text-3xl font-bold text-purple-500">Welcome to QuickStart.AI</h2>
          <p className="mt-2 text-sm text-black">
            {isSignUp ? "Create an account to get started with Chatbot Integration" : "Sign in to your account"}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white py-8 px-6 shadow rounded-lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="email-address" className="sr-only">Email address</label>
                <div className="relative">
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    required
                    className="appearance-none rounded-full relative block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center cursor-pointer">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="appearance-none rounded-full relative block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center cursor-pointer">
                    {showPassword ? (
                      <EyeOff onClick={togglePasswordVisibility} className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye onClick={togglePasswordVisibility} className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {isSignUp && (
                <>
                  <div>
                    <label htmlFor="businessName" className="sr-only">Business Name</label>
                    <div className="relative">
                      <input
                        id="businessName"
                        name="bussinessName"
                        type="text"
                        required
                        className="appearance-none rounded-full relative block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white"
                        placeholder="Business Name"
                        value={formData.bussinessName}
                        onChange={handleChange}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="businessDescription" className="sr-only">Business Description</label>
                    <div className="relative">
                      <textarea
                        id="businessDescription"
                        name="bussinessDescription"
                        required
                        className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white"
                        placeholder="Business Description"
                        value={formData.bussinessDescription}
                        onChange={handleChange}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clipboard className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="businessCategory" className="sr-only">Business Category</label>
                    <div className="relative">
                      <input
                        id="businessCategory"
                        name="bussinessCategory"
                        type="text"
                        required
                        className="appearance-none rounded-full relative block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white"
                        placeholder="Business Category"
                        value={formData.bussinessCategory}
                        onChange={handleChange}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Briefcase className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700">Profile Picture</label>
                    <div className="mt-1 flex items-center">
                      <input
                        id="profilePicture"
                        name="profilePicture"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="profilePicture" className="cursor-pointer mt-1 w-full flex justify-center border-2 border-gray-300 border-dashed rounded-md py-2 text-gray-600">
                        <Upload className="mr-2 h-5 w-5 text-gray-400" />
                        Upload Profile Picture
                      </label>
                    </div>
                    {profileImageUrl && (
                      <img src={profileImageUrl} alt="Profile Preview" className="mt-4 w-32 h-32 object-cover rounded-full" />
                    )}
                  </div>
                </>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
                </button>
              </div>
            </div>
          </form>

          <div className="flex items-center justify-center mt-6">
            <p className="text-sm text-gray-600">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
              <button onClick={toggleAuthMode} className="font-medium text-purple-500 hover:text-purple-600 ml-2">
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
