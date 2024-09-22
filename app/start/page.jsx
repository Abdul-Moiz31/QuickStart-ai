"use client";
import React, { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Building,
  Briefcase,
  Clipboard,
  Image,
} from "lucide-react";
import { motion } from "framer-motion";
import { signUp, login, clearState,loadUser } from "@/slices/userSlice";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { storage } from "@/Firebase/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";


export default function UserAuth() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { error, loading, isUserRegistered, isUserLogged, user } = useSelector(
    (state) => state.user
  );
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
  // if user role is user navigate to /user and if admin navigate to /admin
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.readyState === 2) {
        setFormData({ ...formData, picture: file });
      }
    };

    reader.readAsDataURL(file);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    dispatch(login(loginData));
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    const storageRef = ref(storage, `users/${formData.email}`);
    const uploadTask = uploadBytesResumable(storageRef, formData.picture);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
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
        });
      }
    );
  };

  const toggleAuthMode = () => setIsSignUp(!isSignUp);
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="flex w-full max-w-6xl bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Left Side: Image */}
        <motion.div
          className="w-1/2 hidden lg:block"
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.5 }}
        >
          <img
            src="sign.png"
            alt="signbot"
            className="object-cover w-full h-80%"
          />
        </motion.div>

        {/* Right Side: Form */}
        <motion.div
          className="w-full lg:w-1/2 flex flex-col justify-center p-8 bg-white"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-800">
              {isSignUp ? "Create your account" : "Sign in to your account"}
            </h2>
          </div>
          <form className="mt-8 space-y-6" action="#" method="POST">
            <input type="hidden" name="remember" value="true" />
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
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none rounded-full relative block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                    placeholder="Email address"
                    value={isSignUp ? formData.email : loginData.email}
                    onChange={isSignUp ? handleChange : handleLoginChange}
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
                    autoComplete="current-password"
                    required
                    className="appearance-none rounded-full relative block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                    value={isSignUp ? formData.password : loginData.password}
                    onChange={isSignUp ? handleChange : handleLoginChange}
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
              {isSignUp && (
                <>
                  <div>
                    <label htmlFor="bussinessName" className="sr-only">
                      Business Name
                    </label>
                    <div className="relative">
                      <input
                        id="bussinessName"
                        name="bussinessName"
                        type="text"
                        required
                        className="appearance-none rounded-full relative block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
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
                    <label htmlFor="bussinessDescription" className="sr-only">
                      Business Description
                    </label>
                    <div className="relative">
                      <input
                        id="bussinessDescription"
                        name="bussinessDescription"
                        type="text"
                        required
                        className="appearance-none rounded-full relative block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                        placeholder="Business Description"
                        value={formData.bussinessDescription}
                        onChange={handleChange}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Briefcase className="h-5 w-5 text-gray-400" />
                      </div>
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
                        required
                        className="appearance-none rounded-full relative block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                        placeholder="Business Category"
                        value={formData.bussinessCategory}
                        onChange={handleChange}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clipboard className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="picture" className="sr-only">
                      Picture
                    </label>
                    <div className="relative">
                      <input
                        id="picture"
                        name="picture"
                        type="file"
                        accept="image/*"
                        required
                        className="appearance-none rounded-full relative block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                        onChange={handleImageChange}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Image className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                onClick={isSignUp ? handleSignUp : handleLogin}
              >
                {isSignUp ? "Sign up" : "Sign in"}
              </button>
            </div>
            <div className="text-center text-sm text-gray-600 mt-4">
              {isSignUp ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="font-medium text-purple-600 hover:text-purple-500"
                    onClick={toggleAuthMode}
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="font-medium text-purple-600 hover:text-purple-500"
                    onClick={toggleAuthMode}
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}