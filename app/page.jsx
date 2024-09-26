import Hero from "@/components/hero";
import NavBar from "@/components/navbar";
import Footer from "@/components/footer";
import About from "@/components/about";
import Pricing from "@/components/pricing";
import Faq from "@/components/faq";
import Feature from "@/components/feature";
import Contact from "@/components/contact";



export default function Home() {
  return (
    <main className="flex flex-col min-h-dvh bg-white">
      <NavBar />
      <Hero />
      <About/>
      <Feature/>
      <Pricing/>
      <Faq/>
      <Contact/>
      <Footer/>
      
      
      
    </main>
  );
}
