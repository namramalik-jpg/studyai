"use client";

import { BookOpenText, Bot, GraduationCap, Heart } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const stats = [
  {
    label: "Students",
    value: 10,
    suffix: "K+",
    icon: GraduationCap,
    accent: "bg-indigo-50 text-primary border-indigo-100",
  },
  {
    label: "Notes Generated",
    value: 500,
    suffix: "K+",
    icon: BookOpenText,
    accent: "bg-violet-50 text-violet-700 border-violet-100",
  },
  {
    label: "Satisfaction",
    value: 98,
    suffix: "%",
    icon: Heart,
    accent: "bg-rose-50 text-rose-700 border-rose-100",
  },
  {
    label: "AI Available",
    value: 24,
    suffix: "/7",
    icon: Bot,
    accent: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
];

function AnimatedNumber({ value, suffix }) {
  return (
    <span>
      {value}
      {suffix}
    </span>
  );
}

export default function StatsSection() {
  return (
    <section className="landing-section landing-section-tight">
      <div className="pointer-events-none absolute -left-36 top-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.10)_0%,transparent_70%)] blur-sm" />
      <div className="pointer-events-none absolute right-[-8rem] bottom-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.09)_0%,transparent_70%)] blur-sm" />
      <div className="landing-hairline" />

      <div className="landing-container">
        <ScrollReveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;

              return (
                <article
                  key={stat.label}
                  className="landing-card landing-card-hover group p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                        <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                      </p>
                      <p className="mt-2 text-sm font-bold text-slate-500">
                        {stat.label}
                      </p>
                    </div>
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:scale-105 ${stat.accent}`}>
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700 group-hover:bg-primary-hover"
                      style={{ width: `${index === 3 ? 100 : 76 + index * 7}%` }}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
