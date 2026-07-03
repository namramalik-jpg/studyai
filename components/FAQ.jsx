"use client";

import { ChevronDown, HelpCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import ScrollReveal from "./ScrollReveal";

const faqs = [
  {
    question: "How does StudyAI work?",
    answer:
      "Enter a topic, paste study material, or ask a question. StudyAI uses AI to generate clear notes, summaries, explanations, quizzes, and practice material in seconds.",
  },
  {
    question: "Is it free?",
    answer:
      "Yes. You can start using StudyAI for free. The landing page and current tools are designed so students can quickly try notes, summaries, and question solving.",
  },
  {
    question: "Can I upload PDFs?",
    answer:
      "PDF upload can be added as a next feature. The current workflow supports entering topics, pasting text, and saving AI-generated study material.",
  },
  {
    question: "Does it create quizzes?",
    answer:
      "Yes. StudyAI can create quiz-style practice questions from your notes and topics so you can test your understanding before exams.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="landing-section landing-section-alt">
      <div className="pointer-events-none absolute -left-44 top-8 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.10)_0%,transparent_70%)] blur-sm" />
      <div className="pointer-events-none absolute right-[-12rem] bottom-0 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.10)_0%,transparent_70%)] blur-sm" />
      <div className="landing-hairline" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <p className="landing-eyebrow">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            FAQ
          </p>
          <h2 className="landing-title mt-5">
            Questions students ask
          </h2>
          <p className="landing-subtitle">
            Quick answers about how StudyAI helps you create better study
            material with less effort.
          </p>
        </ScrollReveal>

        <ScrollReveal delay="delay-150" className="mt-11">
          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;

              return (
                <article
                  key={faq.question}
                  className="landing-card landing-card-hover overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-primary">
                        <HelpCircle className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="text-base font-black text-slate-950 sm:text-lg">
                        {faq.question}
                      </span>
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-slate-400 transition duration-300 ${
                        isOpen ? "rotate-180 text-primary" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  <div
                    id={`faq-answer-${index}`}
                    className={`grid transition-all duration-300 ease-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="border-t border-slate-100 px-5 py-5 text-sm leading-7 text-slate-600 sm:px-6">
                        {faq.answer}
                      </p>
                    </div>
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
