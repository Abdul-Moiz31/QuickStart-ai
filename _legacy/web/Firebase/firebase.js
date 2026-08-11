// src/firebase.js
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCpXLKudteWOHeOMIDc-sYBCJxilW1JwpI",
    authDomain: "quickstart-ai-e40e1.firebaseapp.com",
    projectId: "quickstart-ai-e40e1",
    storageBucket: "quickstart-ai-e40e1.appspot.com",
    messagingSenderId: "1065387031682",
    appId: "1:1065387031682:web:03d98d0fb17478f67fc89b",
    measurementId: "G-37BP7TX63K"
  };
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { app, storage };
