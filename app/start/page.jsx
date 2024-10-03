"use client"
import { motion } from "framer-motion";
import { useState,useEffect } from "react";
import { ArrowLeft, Briefcase, Building, Clipboard, Eye, EyeOff, User, Upload } from "lucide-react"; // Import the Upload icon
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../Firebase/firebase"; // Import Firebase storage
import { signUp, login, clearState,loadUser } from "@/slices/userSlice";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function AuthForm() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { error, loading, isUserRegistered, isUserLogged, user } = useSelector(
    (state) => state.user
  );
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    picture: "",
    bussinessName: "",
    bussinessDescription: "",
    bussinessCategory: "",
  });
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [file, setFile] = useState(null); // File state for image upload
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const toggleAuthMode = () => setIsSignUp(!isSignUp);
  const [uploadProgress, setUploadProgress] = useState(0); // For tracking upload progress
  const [uploadingImage, setUploadingImage] = useState(false); 
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (user && user.role === "user") {
      router.push("/user");
    } else if (user && user.role === "admin") {
      router.push("/admin");
    }
  }, [user, router]);
  useEffect(() => {
    if (isUserRegistered) {
      toast.success("User registered successfully");
      dispatch(clearState());
      dispatch(loadUser());
      // clear form data
      setFormData({
        name: "",
        email: "",
        password: "",
        picture: "",
        bussinessName: "",
        bussinessDescription: "",
        bussinessCategory: "",
      });
      // emty the image preview
      setProfileImageUrl("");
    }
    if (isUserLogged) {
      toast.success("User logged in successfully");
      dispatch(clearState());
      dispatch(loadUser());
      // clear form data
      setLoginData({
        email: "",
        password: "",
      });
    }
    if (error) {
      // Show error message
      console.log(error);
      toast.error(error);
      dispatch(clearState());
    }
  }, [isUserRegistered, isUserLogged, error, dispatch]);
  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0]; // Get the selected file
  
    if (file) {
      const previewUrl = URL.createObjectURL(file); // Create a preview URL from the file
      setProfileImageUrl(previewUrl); // Set the preview URL for the image
  
      setFormData({ ...formData, picture: file }); // Set the file to formData.picture
    }
  };
  

  const handleLogin = (e) => {
    e.preventDefault();
    dispatch(login(loginData));
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    setUploadingImage(true);
    const storageRef = ref(storage, `users/${formData.email}`);
    const uploadTask = uploadBytesResumable(storageRef, formData.picture);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        console.log(`Upload is ${progress}% done`);
        switch (snapshot.state) {
          case "paused":
            console.log("Upload is paused");
            break;
          case "running":
            console.log("Upload is running");
            break;
        }
      },
      (error) => {
        console.log(error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          console.log("File available at", downloadURL);
          formData.picture = downloadURL;
          dispatch(signUp(formData));
          setUploadingImage(false);
        });
      }
    );
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
          <img 
src="/file.png" 
alt="Site Logo" 
className="h-20 w-auto mx-auto cursor-pointer"
onClick={() => router.push("/")} />
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
          <form  className="space-y-6">
            <div className="rounded-md shadow-sm space-y-4">
            {isSignUp && (
                <>
                  <div>
                    <label htmlFor="name" className="sr-only">
                      Name
                    </label>
                    <div className="relative">
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        className="appearance-none rounded-full relative block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                        placeholder="Name"
                        value={formData.name}
                        onChange={handleChange}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </>
              )}
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
                    value={isSignUp ? formData.email : loginData.email}
                    onChange={isSignUp ? handleChange : handleLoginChange}
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
                    value={isSignUp ? formData.password : loginData.password}
                    onChange={isSignUp ? handleChange : handleLoginChange}
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
                        onChange={handleImageChange}
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
                    {uploadingImage && (
                    <div className="w-full bg-gray-200 h-2 mt-2 rounded-lg">
                      <div
                        className="bg-purple-500 h-3 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  )}
                  </div>
                </>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  onClick={isSignUp ? handleSignUp : handleLogin}
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
