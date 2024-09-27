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
</main>

  );
}
