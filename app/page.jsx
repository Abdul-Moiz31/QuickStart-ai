import Hero from "@/components/hero";
import NavBar from "@/components/navbar";
import Footer from "@/components/footer";
import About from "@/components/about";
import Pricing from "@/components/pricing";
import Faq from "@/components/faq";




export default function Home() {
  return (
    <main className="flex flex-col min-h-dvh">
      <NavBar />
      <Hero />
      <About/>
      <Pricing/>
      <Faq/>
      <Footer/>
      
      
      
    </main>
  );
}
