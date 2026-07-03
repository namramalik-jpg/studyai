"use client";

import { CheckCircle2, X } from "lucide-react";
import { useMemo, useState } from "react";

function normalizeAnswer(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function isAnswerCorrect(question, answer) {
  const cleanAnswer = normalizeAnswer(answer);
  const correctAnswer = normalizeAnswer(question.answer);

  if (!cleanAnswer || !correctAnswer) {
    return false;
  }

  if (question.type === "short_answer") {
    return (
      cleanAnswer === correctAnswer ||
      (cleanAnswer.length > 3 && correctAnswer.includes(cleanAnswer)) ||
      (correctAnswer.length > 3 && cleanAnswer.includes(correctAnswer))
    );
  }

  return cleanAnswer === correctAnswer;
}

export default function QuizModal({ quiz, noteTitle, onClose, onSubmitScore }) {
  const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const totalQuestions = questions.length;
  const resultText = useMemo(
    () => `${score} / ${totalQuestions} correct`,
    [score, totalQuestions]
  );

  function setAnswer(index, value) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [index]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextScore = questions.reduce(
      (total, question, index) =>
        total + (isAnswerCorrect(question, answers[index]) ? 1 : 0),
      0
    );

    setScore(nextScore);
    setIsSubmitted(true);
    await onSubmitScore?.(nextScore);
  }

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="generated-quiz-title">
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-border bg-card p-4 shadow-card dark:border-white/10 dark:bg-background sm:p-6">
        <div className="flex flex-col gap-4 border-b border-border pb-4 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-wide text-primary dark:text-primary">
              Generated Quiz
            </p>
            <h2 id="generated-quiz-title" className="mt-2 break-words text-2xl font-bold text-text dark:text-text">
              {quiz?.title || `Quiz: ${noteTitle}`}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted dark:text-muted">
              Answer all questions, then submit to see your score and correct answers.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-muted transition hover:bg-primary/10 hover:text-primary-hover dark:border-white/10 dark:text-text dark:hover:bg-card/10"
            aria-label="Close quiz"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
          {questions.map((question, index) => {
            const userAnswer = answers[index] || "";
            const correct = isAnswerCorrect(question, userAnswer);

            return (
              <section
                key={`${question.question}-${index}`}
                className="rounded-2xl border border-border bg-primary/10 p-4 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="break-words text-base font-bold text-text dark:text-text">
                    {index + 1}. {question.question}
                  </h3>
                  <span className="w-fit rounded-full bg-card px-3 py-1 text-xs font-bold text-primary-hover dark:bg-white/10 dark:text-primary">
                    {question.type?.replace("_", " ") || "question"}
                  </span>
                </div>

                {question.type === "mcq" && (
                  <div className="mt-4 grid gap-2">
                    {(question.options || []).map((option) => (
                      <label
                        key={option}
                        className="flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl bg-card px-4 py-3 text-sm font-semibold text-text transition hover:bg-primary/10 dark:bg-background/80 dark:text-text dark:hover:bg-card/10"
                      >
                        <input
                          type="radio"
                          name={`question-${index}`}
                          value={option}
                          checked={userAnswer === option}
                          onChange={(event) => setAnswer(index, event.target.value)}
                          disabled={isSubmitted}
                          className="mt-1"
                        />
                        <span className="break-words [overflow-wrap:anywhere]">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === "true_false" && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={`True or false answer for question ${index + 1}`}>
                    {["True", "False"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setAnswer(index, option)}
                        disabled={isSubmitted}
                        role="radio"
                        aria-checked={userAnswer === option}
                        className={`min-h-11 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                          userAnswer === option
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "bg-card text-text hover:bg-primary/10 dark:bg-background/80 dark:text-text dark:hover:bg-card/10"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {question.type === "short_answer" && (
                  <textarea
                    value={userAnswer}
                    onChange={(event) => setAnswer(index, event.target.value)}
                    disabled={isSubmitted}
                    rows={3}
                    placeholder="Write your answer..."
                    aria-label={`Answer question ${index + 1}`}
                    className="mt-4 min-h-24 w-full resize-y rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-6 text-text outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15 dark:border-white/10 dark:bg-background/80 dark:text-text dark:focus:ring-primary/10"
                  />
                )}

                {isSubmitted && (
                  <div
                    className={`mt-4 rounded-2xl border px-4 py-3 text-sm leading-6 ${
                      correct
                        ? "border-emerald-100 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200"
                        : "border-red-100 bg-red-50 text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200"
                    }`}
                  >
                    <p className="font-bold">
                      {correct ? "Correct" : "Correct answer"}: {question.answer}
                    </p>
                    {question.explanation && <p className="mt-1">{question.explanation}</p>}
                  </div>
                )}
              </section>
            );
          })}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {isSubmitted ? (
              <div className="inline-flex items-center gap-2 rounded-2xl bg-primary/10 px-4 py-3 text-sm font-bold text-primary-hover dark:bg-primary/10 dark:text-primary">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                Score: {resultText}
              </div>
            ) : (
              <span className="text-sm font-semibold text-muted dark:text-muted">
                {totalQuestions} questions
              </span>
            )}

            <button
              type={isSubmitted ? "button" : "submit"}
              onClick={isSubmitted ? onClose : undefined}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-hover sm:w-auto"
            >
              {isSubmitted ? "Close" : "Submit Quiz"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
