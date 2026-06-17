"use client";

import { motion } from "framer-motion";
import type { Dictionary } from "@/i18n/dictionaries/ru";

type SEOStatsBlockProps = {
  dict: Dictionary;
};

export function SEOStatsBlock({ dict }: SEOStatsBlockProps) {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-12 text-center text-3xl font-bold text-white md:text-4xl">
          {dict.stats.title}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {dict.stats.items.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 text-center"
            >
              <div className="text-4xl font-bold gradient-text">{stat.value}</div>
              <div className="mt-2 font-semibold text-white">{stat.label}</div>
              <p className="mt-2 text-sm text-slate-400">{stat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
