"use client";

import { motion, useReducedMotion } from "framer-motion";
import { WidgetProductMock } from "@/components/landing/WidgetProductMock";

const ease = [0.22, 1, 0.36, 1] as const;

export function LandingHero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-clay px-4 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-5 md:pb-9 md:mt-4">
      <motion.div
        className="mx-auto w-full max-w-full sm:max-w-[94%] md:max-w-[85%] lg:max-w-[65%]"
        initial={reduce ? false : { opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.85, ease }}
      >
        <WidgetProductMock />
      </motion.div>
    </section>
  );
}
