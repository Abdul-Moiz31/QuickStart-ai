"use client"
import Hero from "@/components/hero";
import NavBar from "@/components/navbar";
import Footer from "@/components/footer";
import About from "@/components/about";
import Pricing from "@/components/pricing";
import Faq from "@/components/faq";
import Feature from "@/components/feature";
import Contact from "@/components/contact";
import { ChatBot } from "@quickstart-ai/chatbot";
import { useEffect } from "react";
import { loadUser } from "@/slices/userSlice";
import { useDispatch } from "react-redux";




export default function Home() {

  const dispatch = useDispatch()

  useEffect(()=>{
    dispatch(loadUser())
  },[])
    

  return (
    <main className="flex flex-col min-h-dvh bg-white">
  <NavBar />
  <section id="hero">
    <Hero />
  </section>
  <section id="about">
    <About />
  </section>
  <section id="features">
    <Feature />
  </section>
  <section id="pricing">
    <Pricing />
  </section>
  <section id="faq">
    <Faq />
  </section>
  <section id="contact">
  <Contact />
  </section>
  <Footer />
    <ChatBot token="A1ED-B33C4EFA-70CD3C04"
      theme="secondary"
      wantToShowSuggestions={true}
    />
</main>

  );
}
