import { Quote, Sparkles, Star } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const testimonials = [
  {
    name: "Ayesha Malik",
    university: "University of Lahore",
    initials: "AM",
    avatarClass: "bg-primary",
    review:
      "StudyAI helped me turn confusing lecture topics into clear notes before exams. The summaries are quick, clean, and easy to revise.",
  },
  {
    name: "Hamza Khan",
    university: "COMSATS University",
    initials: "HK",
    avatarClass: "bg-violet-500",
    review:
      "The question solver feels like having a study partner. It explains each step simply instead of just giving the final answer.",
  },
  {
    name: "Sara Ahmed",
    university: "FAST NUCES",
    initials: "SA",
    avatarClass: "bg-sky-500",
    review:
      "I use StudyAI to create notes, quizzes, and flashcards from the same topic. It makes my study sessions feel organized and less stressful.",
  },
];

export default function Testimonials() {
  return (
    <section className="landing-section landing-section-alt">
      <div className="pointer-events-none absolute -left-44 top-10 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.10)_0%,transparent_70%)] blur-sm" />
      <div className="pointer-events-none absolute right-[-12rem] bottom-0 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.10)_0%,transparent_70%)] blur-sm" />
      <div className="landing-hairline" />

      <div className="landing-container">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="landing-eyebrow">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Student stories
          </p>
          <h2 className="landing-title mt-5">
            Loved by Students Worldwide
          </h2>
          <p className="landing-subtitle">
            Students use StudyAI to make revision faster, clearer, and more
            focused across notes, summaries, and practice.
          </p>
        </ScrollReveal>

        <div className="mt-11 grid gap-5 md:grid-cols-3">
          {testimonials.map((testimonial, index) => {
            const delayClass =
              index === 1 ? "delay-100" : index === 2 ? "delay-200" : "";

            return (
              <ScrollReveal key={testimonial.name} delay={delayClass}>
                <article className="landing-card landing-card-hover group relative flex h-full flex-col overflow-hidden p-6">
                  <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-2xl transition duration-300 group-hover:bg-primary/15" />

                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-white text-sm font-black text-white shadow-sm dark:border-slate-800 ${testimonial.avatarClass}`}
                        aria-label={`${testimonial.name} avatar`}
                      >
                        {testimonial.initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-black text-slate-950">
                          {testimonial.name}
                        </h3>
                        <p className="truncate text-sm font-semibold text-slate-500">
                          {testimonial.university}
                        </p>
                      </div>
                    </div>
                    <Quote className="h-6 w-6 shrink-0 text-primary/35 transition duration-300 group-hover:text-primary/60" aria-hidden="true" />
                  </div>

                  <div className="relative mt-5 flex items-center gap-1 text-warning" aria-label="5 star rating">
                    {[0, 1, 2, 3, 4].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-current" aria-hidden="true" />
                    ))}
                  </div>

                  <p className="relative mt-5 flex-1 text-sm leading-7 text-slate-600">
                    "{testimonial.review}"
                  </p>
                </article>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
