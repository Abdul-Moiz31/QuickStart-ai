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
// import GoogleAnalytics from "@/components/GoogleAnalytics";



export default function Home() {
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
{/*   <GoogleAnalytics gaId="G-1JC2XTV9MM" /> */}
  <ChatBot token="A1ED-D3BA1204-412FC0BA" />
</main>

  );
}
