"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clipboard,
  Download,
  FileQuestion,
  LoaderCircle,
  RotateCcw,
  Save,
  Send,
  Sparkles,
  Target,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { saveAiHistory } from "@/lib/aiHistory";
import { addStudyNotification } from "@/lib/notifications";
import { generateSingleNotePdf } from "@/lib/pdfExport";
import { saveStudyItem } from "@/lib/saveStudyItem";
import { getCurrentUser } from "@/lib/supabase";
import Toast from "./Toast";
import Button from "./ui/Button";
import EmptyState from "./ui/EmptyState";
import Surface from "./ui/Surface";

const MAX_INPUT_LENGTH = 12000;
const difficulties = ["easy", "medium", "hard"];
const questionCounts = [5, 10, 15];
const optionLabels = ["A", "B", "C", "D"];
const quizToggleButtonClass =
  "min-h-11 min-w-0 overflow-hidden whitespace-nowrap rounded-xl px-2 py-2 text-center text-xs font-bold leading-none transition sm:text-sm";

function normalizeAnswer(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function isAnswerCorrect(question, answer) {
  return normalizeAnswer(answer) === normalizeAnswer(question.answer || question.correct_answer);
}

function formatDifficulty(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getQuizText(quiz) {
  const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];

  return questions
    .map((question, index) => {
      const options = (question.options || [])
        .map((option, optionIndex) => `${optionLabels[optionIndex]}. ${option}`)
        .join("\n");

      return `${index + 1}. ${question.question}\n${options}\nCorrect answer: ${question.answer || question.correct_answer}\nExplanation: ${question.explanation || ""}`;
    })
    .join("\n\n");
}

export default function AIQuizGenerator() {
  const [input, setInput] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [savedResultId, setSavedResultId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const cleanInput = input.trim();
  const characterCount = input.length;
  const isInputTooLong = characterCount > MAX_INPUT_LENGTH;
  const questions = useMemo(
    () => (Array.isArray(quiz?.questions) ? quiz.questions : []),
    [quiz]
  );
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).filter((key) => answers[key]).length;
  const score = useMemo(
    () =>
      questions.reduce(
        (total, question, index) =>
          total + (isAnswerCorrect(question, answers[index]) ? 1 : 0),
        0
      ),
    [answers, questions]
  );
  const percentage = questions.length
    ? Math.round((score / questions.length) * 100)
    : 0;
  const wrongAnswers = Math.max(questions.length - score, 0);
  const progressPercent = questions.length
    ? Math.round(((currentIndex + 1) / questions.length) * 100)
    : 0;

  useEffect(() => {
    if (!message && !error) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setMessage("");
      setError("");
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [message, error]);

  async function getAuthenticatedSession() {
    const { supabase, user, error: userError } = await getCurrentUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error("Please log in to use AI Quiz.");
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    const token = sessionData.session?.access_token;

    if (!token) {
      throw new Error("Your session expired. Please log in again.");
    }

    return { supabase, user, token };
  }

  async function generateQuiz(event) {
    event.preventDefault();

    if (isGenerating) {
      return;
    }

    if (!cleanInput) {
      setError("Please enter a topic or paste notes first.");
      return;
    }

    if (isInputTooLong) {
      setError(`Please keep your input under ${MAX_INPUT_LENGTH} characters.`);
      return;
    }

    setIsGenerating(true);
    setQuiz(null);
    setAnswers({});
    setCurrentIndex(0);
    setIsSubmitted(false);
    setSavedResultId("");
    setMessage("");
    setError("");

    try {
      const { supabase, user, token } = await getAuthenticatedSession();
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic: cleanInput.slice(0, 120),
          content: cleanInput,
          difficulty,
          totalQuestions,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not generate quiz.");
      }

      const nextQuiz = payload.quiz;

      if (!nextQuiz?.questions?.length) {
        throw new Error("Gemini did not return quiz questions. Please try again.");
      }

      setQuiz(nextQuiz);
      setMessage("Quiz generated successfully.");

      const { error: historyError } = await saveAiHistory({
        supabase,
        userId: user.id,
        feature: "AI Quiz Generator",
        prompt: cleanInput,
        response: JSON.stringify(nextQuiz, null, 2),
      });

      if (historyError) {
        // History saving is best-effort; generated quizzes should remain usable.
      }

      addStudyNotification(user.id, {
        title: "AI generation completed",
        message: `Quiz generated for "${cleanInput.slice(0, 80)}".`,
        type: "ai",
      });
    } catch (generateError) {
      setError(generateError.message || "Could not generate quiz.");
    } finally {
      setIsGenerating(false);
    }
  }

  function selectAnswer(value) {
    if (isSubmitted || !currentQuestion) {
      return;
    }

    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [currentIndex]: value,
    }));
  }

  function submitQuiz() {
    if (questions.length === 0) {
      return;
    }

    setIsSubmitted(true);
    setSavedResultId("");
    setMessage("Quiz submitted. Review your results below.");
  }

  function retryQuiz() {
    setAnswers({});
    setCurrentIndex(0);
    setIsSubmitted(false);
    setSavedResultId("");
    setMessage("");
    setError("");
  }

  function generateNewQuiz() {
    setQuiz(null);
    setAnswers({});
    setCurrentIndex(0);
    setIsSubmitted(false);
    setSavedResultId("");
    setMessage("");
    setError("");
  }

  function clearAll() {
    setInput("");
    setDifficulty("medium");
    setTotalQuestions(5);
    generateNewQuiz();
  }

  async function saveQuizResult() {
    if (!quiz || !isSubmitted || isSaving) {
      return;
    }

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const { supabase, user } = await getAuthenticatedSession();
      const data = await saveStudyItem(supabase, {
        type: "quiz_history",
        title: cleanInput.slice(0, 160) || quiz.topic || quiz.title || "AI Quiz",
        difficulty,
        total_questions: questions.length,
        score,
        quiz_data: {
          ...quiz,
          answers,
          score,
          percentage,
          submitted_at: new Date().toISOString(),
        },
      });

      setSavedResultId(data?.id || "");
      setMessage("Quiz result saved.");
      addStudyNotification(user.id, {
        title: "Quiz result saved",
        message: `Score saved: ${score}/${questions.length} (${percentage}%).`,
        type: "success",
      });
    } catch (saveError) {
      setError(saveError.message || "Could not save quiz result.");
    } finally {
      setIsSaving(false);
    }
  }

  async function copyQuestions() {
    if (!quiz || isCopying) {
      return;
    }

    setIsCopying(true);
    setMessage("");
    setError("");

    try {
      await navigator.clipboard.writeText(getQuizText(quiz));
      setMessage("Quiz questions copied to clipboard.");
    } catch (_copyError) {
      setError("Copy failed. Please select the questions and copy manually.");
    } finally {
      setIsCopying(false);
    }
  }

  async function downloadPdf() {
    if (!quiz) {
      return;
    }

    try {
      const jspdfModule = await import("jspdf");
      generateSingleNotePdf(
        {
          title: quiz.title || "StudyAI Quiz",
          content: getQuizText(quiz),
        },
        jspdfModule.jsPDF
      );
      setMessage("PDF downloaded successfully.");
    } catch (_pdfError) {
      setError("PDF export is not available right now.");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
      <Surface className="p-5 sm:p-6">
        <form onSubmit={generateQuiz} className="grid gap-5" aria-busy={isGenerating}>
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Gemini-powered
            </p>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-text">
              Build an interactive quiz
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Enter a topic or paste your notes. StudyAI will generate MCQs with
              answers and explanations.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="ai-quiz-input" className="text-sm font-black text-text">
                Topic or pasted notes
              </label>
              <span
                id="ai-quiz-counter"
                className={`text-xs font-bold ${
                  isInputTooLong ? "text-danger" : "text-muted"
                }`}
              >
                {input.length}/{MAX_INPUT_LENGTH}
              </span>
            </div>
            <textarea
              id="ai-quiz-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={10}
              placeholder="Example: JavaScript closures, scope, lexical environment, and practical examples..."
              className="mt-3 min-h-64 w-full resize-y rounded-2xl border border-border bg-background px-4 py-4 text-sm leading-7 text-text outline-none transition placeholder:text-muted focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-sidebar"
              disabled={isGenerating}
              aria-describedby="ai-quiz-counter"
              aria-invalid={isInputTooLong}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p id="quiz-difficulty-label" className="text-sm font-black text-text">Difficulty</p>
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-surface p-2" role="radiogroup" aria-labelledby="quiz-difficulty-label">
                {difficulties.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setDifficulty(item)}
                    disabled={isGenerating}
                    role="radio"
                    aria-checked={difficulty === item}
                    className={`${quizToggleButtonClass} ${
                      difficulty === item
                        ? "bg-card text-primary shadow-sm"
                        : "text-muted hover:bg-card hover:text-primary"
                    }`}
                  >
                    {formatDifficulty(item)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p id="quiz-count-label" className="text-sm font-black text-text">Questions</p>
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-surface p-2" role="radiogroup" aria-labelledby="quiz-count-label">
                {questionCounts.map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setTotalQuestions(count)}
                    disabled={isGenerating}
                    role="radio"
                    aria-checked={totalQuestions === count}
                    className={`${quizToggleButtonClass} ${
                      totalQuestions === count
                        ? "bg-card text-primary shadow-sm"
                        : "text-muted hover:bg-card hover:text-primary"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              type="submit"
              size="lg"
              disabled={isGenerating || !cleanInput || isInputTooLong}
              className="w-full"
            >
              {isGenerating ? (
                <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-5 w-5" aria-hidden="true" />
              )}
              {isGenerating ? "Generating..." : "Generate Quiz"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={clearAll}
              disabled={isGenerating && !quiz}
              className="w-full"
            >
              <Trash2 className="h-5 w-5" aria-hidden="true" />
              Clear
            </Button>
          </div>

          <div className="grid gap-3">
            <Toast message={message} />
            <Toast message={error} type="error" />
          </div>
        </form>
      </Surface>

      <Surface className="min-h-[40rem] p-5 sm:p-6">
        {isGenerating ? (
          <div className="grid gap-4" role="status" aria-live="polite">
            <span className="sr-only">Generating quiz questions. Please wait.</span>
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-2xl border border-border bg-surface"
              />
            ))}
          </div>
        ) : quiz && isSubmitted ? (
          <div className="grid gap-5">
            <div className="rounded-3xl border border-border bg-surface p-5">
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primary">
                <Target className="h-4 w-4" aria-hidden="true" />
                Results
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-text">
                {score}/{questions.length} correct
              </h2>
              <p className="mt-2 text-sm font-semibold text-muted">
                {percentage}% score - {score} correct - {wrongAnswers} wrong
              </p>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-card" role="progressbar" aria-label="Quiz score percentage" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}>
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <Button type="button" variant="secondary" onClick={retryQuiz}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Retry
              </Button>
              <Button type="button" variant="secondary" onClick={generateNewQuiz}>
                <FileQuestion className="h-4 w-4" aria-hidden="true" />
                New
              </Button>
              <Button
                type="button"
                onClick={saveQuizResult}
                disabled={isSaving || Boolean(savedResultId)}
              >
                {isSaving ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="h-4 w-4" aria-hidden="true" />
                )}
                {savedResultId ? "Saved" : "Save"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={copyQuestions}
                disabled={isCopying}
              >
                {isCopying ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Clipboard className="h-4 w-4" aria-hidden="true" />
                )}
                Copy
              </Button>
              <Button type="button" variant="secondary" onClick={downloadPdf}>
                <Download className="h-4 w-4" aria-hidden="true" />
                PDF
              </Button>
            </div>

            <div className="grid gap-4">
              {questions.map((question, index) => {
                const userAnswer = answers[index] || "";
                const correct = isAnswerCorrect(question, userAnswer);

                return (
                  <article
                    key={`${question.question}-${index}`}
                    className="rounded-3xl border border-border bg-card p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <h3 className="break-words text-base font-black text-text">
                        {index + 1}. {question.question}
                      </h3>
                      <span
                        className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${
                          correct
                            ? "bg-success/10 text-success"
                            : "bg-danger/10 text-danger"
                        }`}
                      >
                        {correct ? (
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <XCircle className="h-4 w-4" aria-hidden="true" />
                        )}
                        {correct ? "Correct" : "Wrong"}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-2">
                      {(question.options || []).map((option, optionIndex) => {
                        const isCorrectOption = normalizeAnswer(option) === normalizeAnswer(question.answer);
                        const isUserOption = normalizeAnswer(option) === normalizeAnswer(userAnswer);

                        return (
                          <div
                            key={`${option}-${optionIndex}`}
                            className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                              isCorrectOption
                                ? "border-success/30 bg-success/10 text-success"
                                : isUserOption
                                  ? "border-danger/30 bg-danger/10 text-danger"
                                  : "border-border bg-surface text-muted"
                            }`}
                          >
                            {optionLabels[optionIndex]}. {option}
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-4 text-sm leading-6 text-muted">
                      <span className="font-black text-text">Explanation:</span>{" "}
                      {question.explanation}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        ) : quiz && currentQuestion ? (
          <div className="grid gap-5">
            <div className="border-b border-border pb-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-primary">
                    Question {currentIndex + 1} of {questions.length}
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-text">
                    {quiz.title || "Generated Quiz"}
                  </h2>
                </div>
                <span className="inline-flex w-fit rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-black text-primary">
                  {formatDifficulty(difficulty)} - {answeredCount}/{questions.length} answered
                </span>
              </div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-surface" role="progressbar" aria-label="Quiz question progress" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={currentIndex + 1}>
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <article className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <h3 className="break-words text-xl font-black leading-8 text-text">
                {currentQuestion.question}
              </h3>
              <div className="mt-5 grid gap-3" role="radiogroup" aria-label={`Answers for question ${currentIndex + 1}`}>
                {(currentQuestion.options || []).map((option, optionIndex) => {
                  const isSelected = answers[currentIndex] === option;

                  return (
                    <button
                      key={`${option}-${optionIndex}`}
                      type="button"
                      onClick={() => selectAnswer(option)}
                      disabled={isSubmitted}
                      role="radio"
                      aria-checked={isSelected}
                      className={`flex min-h-14 items-start gap-3 rounded-2xl border px-4 py-4 text-left text-sm font-bold transition hover:-translate-y-0.5 ${
                        isSelected
                          ? "border-primary bg-primary text-white shadow-glow"
                          : "border-border bg-surface text-text hover:border-primary/50 hover:bg-card"
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                          isSelected ? "bg-white/20 text-white" : "bg-card text-primary"
                        }`}
                      >
                        {optionLabels[optionIndex]}
                      </span>
                      <span className="break-words [overflow-wrap:anywhere]">{option}</span>
                    </button>
                  );
                })}
              </div>
            </article>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCurrentIndex((index) => Math.max(index - 1, 0))}
                disabled={currentIndex === 0}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Previous
              </Button>

              <div className="flex flex-col gap-3 sm:flex-row">
                {currentIndex < questions.length - 1 ? (
                  <Button
                    type="button"
                    onClick={() =>
                      setCurrentIndex((index) => Math.min(index + 1, questions.length - 1))
                    }
                  >
                    Next
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={submitQuiz}
                    disabled={answeredCount < questions.length}
                    aria-describedby={answeredCount < questions.length ? "quiz-submit-hint" : undefined}
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Submit Quiz
                  </Button>
                )}
              </div>
            </div>
            {answeredCount < questions.length && (
              <p id="quiz-submit-hint" className="text-center text-sm font-semibold text-muted sm:text-right">
                Answer all questions to submit the quiz.
              </p>
            )}
          </div>
        ) : (
          <EmptyState
            icon={FileQuestion}
            title="No quiz generated yet"
            description="Enter a topic or paste notes, choose difficulty and question count, then generate your quiz."
            className="min-h-[32rem]"
          />
        )}
      </Surface>
    </div>
  );
}
