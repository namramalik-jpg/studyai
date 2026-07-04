"use client";

import {
  BrainCircuit,
  CheckCircle2,
  Clipboard,
  Download,
  Layers,
  LoaderCircle,
  RotateCcw,
  Save,
  Send,
  Shuffle,
  Sparkles,
  Trash2,
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
const cardCounts = [10, 20, 30];
const ratings = ["easy", "medium", "hard"];

function formatRating(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getCardId(card, index) {
  return card.id || `card-${index + 1}`;
}

function getDeckText(cards) {
  return cards
    .map(
      (card, index) =>
        `${index + 1}. Front: ${card.front || card.front_text}\nBack: ${card.back || card.back_text}`
    )
    .join("\n\n");
}

function shuffleCards(cards) {
  const nextCards = [...cards];

  for (let index = nextCards.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [nextCards[index], nextCards[randomIndex]] = [nextCards[randomIndex], nextCards[index]];
  }

  return nextCards;
}

export default function AIFlashcardsGenerator() {
  const [input, setInput] = useState("");
  const [totalCards, setTotalCards] = useState(10);
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardRatings, setCardRatings] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [savedDeckId, setSavedDeckId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const cleanInput = input.trim();
  const isInputTooLong = input.length > MAX_INPUT_LENGTH;
  const currentCard = cards[currentIndex];
  const ratedCount = useMemo(
    () =>
      cards.filter((card, index) => Boolean(cardRatings[getCardId(card, index)]))
        .length,
    [cardRatings, cards]
  );
  const progressPercent = cards.length
    ? Math.round((ratedCount / cards.length) * 100)
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
      throw new Error("Please log in to use Flashcards.");
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

  async function generateDeck(event) {
    event?.preventDefault();

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
    setCards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setCardRatings({});
    setSavedDeckId("");
    setMessage("");
    setError("");

    try {
      const { supabase, user, token } = await getAuthenticatedSession();
      const response = await fetch("/api/generate-flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic: cleanInput.slice(0, 120),
          content: cleanInput,
          totalCards,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not generate flashcards.");
      }

      const nextCards = Array.isArray(payload.flashcards) ? payload.flashcards : [];

      if (nextCards.length === 0) {
        throw new Error("Gemini did not return flashcards. Please try again.");
      }

      setCards(nextCards);
      setMessage("Flashcards generated successfully.");

      const { error: historyError } = await saveAiHistory({
        supabase,
        userId: user.id,
        feature: "Flashcard Generator",
        prompt: cleanInput,
        response: JSON.stringify(nextCards, null, 2),
      });

      if (historyError) {
        // History saving is best-effort; generated flashcards should remain usable.
      }

      addStudyNotification(user.id, {
        title: "AI generation completed",
        message: `Flashcards generated for "${cleanInput.slice(0, 80)}".`,
        type: "ai",
      });
    } catch (generateError) {
      setError(generateError.message || "Could not generate flashcards.");
    } finally {
      setIsGenerating(false);
    }
  }

  function goToCard(nextIndex) {
    setCurrentIndex(Math.max(0, Math.min(cards.length - 1, nextIndex)));
    setIsFlipped(false);
  }

  function markCard(rating) {
    if (!currentCard) {
      return;
    }

    setCardRatings((currentRatings) => ({
      ...currentRatings,
      [getCardId(currentCard, currentIndex)]: rating,
    }));
  }

  function shuffleDeck() {
    setCards((currentCards) => shuffleCards(currentCards));
    setCurrentIndex(0);
    setIsFlipped(false);
  }

  function restartDeck() {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCardRatings({});
    setMessage("");
    setError("");
  }

  function clearDeck() {
    setInput("");
    setTotalCards(10);
    setCards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setCardRatings({});
    setSavedDeckId("");
    setMessage("");
    setError("");
  }

  async function saveDeck() {
    if (cards.length === 0 || isSaving) {
      return;
    }

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const { supabase, user } = await getAuthenticatedSession();
      const data = await saveStudyItem(supabase, {
        type: "flashcard_decks",
        title: cleanInput.slice(0, 160) || "Study Flashcards",
        flashcards_json: {
          cards,
          ratings: cardRatings,
        },
        total_cards: cards.length,
      });

      setSavedDeckId(data?.id || "");
      setMessage("Flashcard deck saved.");
      addStudyNotification(user.id, {
        title: "Flashcards saved",
        message: `${cards.length} flashcards were saved to your workspace.`,
        type: "success",
      });
    } catch (saveError) {
      setError(saveError.message || "Could not save flashcards.");
    } finally {
      setIsSaving(false);
    }
  }

  async function copyAll() {
    if (cards.length === 0 || isCopying) {
      return;
    }

    setIsCopying(true);
    setMessage("");
    setError("");

    try {
      await navigator.clipboard.writeText(getDeckText(cards));
      setMessage("Flashcards copied to clipboard.");
    } catch (_copyError) {
      setError("Copy failed. Please select the deck and copy manually.");
    } finally {
      setIsCopying(false);
    }
  }

  async function downloadPdf() {
    if (cards.length === 0) {
      return;
    }

    try {
      const jspdfModule = await import("jspdf");
      generateSingleNotePdf(
        {
          title: cleanInput.slice(0, 80) || "StudyAI Flashcards",
          content: getDeckText(cards),
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
        <form onSubmit={generateDeck} className="grid gap-5" aria-busy={isGenerating}>
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Gemini-powered
            </p>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-text">
              Generate a flashcard deck
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Enter a topic or paste notes. StudyAI will create recall cards
              with clear answers and explanations.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="ai-flashcards-input" className="text-sm font-black text-text">
                Topic or pasted notes
              </label>
              <span
                id="ai-flashcards-counter"
                className={`text-xs font-bold ${
                  isInputTooLong ? "text-danger" : "text-muted"
                }`}
              >
                {input.length}/{MAX_INPUT_LENGTH}
              </span>
            </div>
            <textarea
              id="ai-flashcards-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={10}
              placeholder="Example: Cell biology, organelles, mitochondria, nucleus, ribosomes, and their functions..."
              className="mt-3 min-h-64 w-full resize-y rounded-2xl border border-border bg-background px-4 py-4 text-sm leading-7 text-text outline-none transition placeholder:text-muted focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-sidebar"
              disabled={isGenerating}
              aria-describedby="ai-flashcards-counter"
              aria-invalid={isInputTooLong}
            />
          </div>

          <div>
            <p id="flashcard-count-label" className="text-sm font-black text-text">Number of flashcards</p>
            <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-surface p-2" role="radiogroup" aria-labelledby="flashcard-count-label">
              {cardCounts.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setTotalCards(count)}
                  disabled={isGenerating}
                  role="radio"
                  aria-checked={totalCards === count}
                  className={`min-h-11 rounded-xl px-3 py-2 text-sm font-bold transition ${
                    totalCards === count
                      ? "bg-card text-primary shadow-sm"
                      : "text-muted hover:bg-card hover:text-primary"
                  }`}
                >
                  {count}
                </button>
              ))}
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
              {isGenerating ? "Generating..." : "Generate Flashcards"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={clearDeck}
              disabled={isGenerating && cards.length === 0}
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
            <span className="sr-only">Generating flashcards. Please wait.</span>
            {[0, 1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-20 animate-pulse rounded-2xl border border-border bg-surface"
              />
            ))}
          </div>
        ) : currentCard ? (
          <div className="grid gap-5">
            <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-primary">
                  Flashcard {currentIndex + 1} / {cards.length}
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-text">
                  Study deck
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Click the card to flip. Mark each card as Easy, Medium, or
                  Hard to track review progress.
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-black text-primary">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                {ratedCount}/{cards.length} reviewed
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-surface" role="progressbar" aria-label="Flashcard review progress" aria-valuemin={0} aria-valuemax={cards.length} aria-valuenow={ratedCount}>
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <button
              type="button"
              onClick={() => setIsFlipped((currentValue) => !currentValue)}
              className="block w-full text-left [perspective:1200px]"
              aria-label={isFlipped ? "Show flashcard front" : "Show flashcard back"}
              aria-pressed={isFlipped}
            >
              <div
                className={`relative min-h-80 rounded-3xl transition duration-500 [transform-style:preserve-3d] ${
                  isFlipped ? "[transform:rotateY(180deg)]" : ""
                }`}
              >
                <div className="absolute inset-0 rounded-3xl border border-primary/30 bg-primary p-6 text-white shadow-glow [backface-visibility:hidden] sm:p-8">
                  <p className="text-sm font-black uppercase tracking-wide text-white/80">
                    Front
                  </p>
                  <div className="flex min-h-56 items-center justify-center text-center">
                    <p className="break-words text-2xl font-black leading-snug [overflow-wrap:anywhere] sm:text-3xl">
                      {currentCard.front || currentCard.front_text}
                    </p>
                  </div>
                </div>

                <div className="absolute inset-0 rounded-3xl border border-border bg-card/95 p-6 text-text shadow-card backdrop-blur-xl [backface-visibility:hidden] [transform:rotateY(180deg)] dark:bg-card sm:p-8">
                  <p className="text-sm font-black uppercase tracking-wide text-primary">
                    Back
                  </p>
                  <div className="flex min-h-56 items-center justify-center text-center">
                    <p className="break-words text-lg font-semibold leading-8 [overflow-wrap:anywhere] sm:text-xl">
                      {currentCard.back || currentCard.back_text}
                    </p>
                  </div>
                </div>
              </div>
            </button>

            <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Rate this flashcard">
              {ratings.map((rating) => {
                const cardId = getCardId(currentCard, currentIndex);
                const isActive = cardRatings[cardId] === rating;

                return (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => markCard(rating)}
                    role="radio"
                    aria-checked={isActive}
                    className={`min-h-11 rounded-xl px-4 py-2 text-sm font-black transition hover:-translate-y-0.5 ${
                      isActive
                        ? "bg-primary text-white shadow-glow"
                        : "border border-border bg-surface text-muted hover:border-primary/50 hover:bg-card hover:text-primary"
                    }`}
                  >
                    {formatRating(rating)}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="secondary"
                onClick={() => goToCard(currentIndex - 1)}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>
              <div className="text-center text-sm font-black text-muted">
                {currentIndex + 1} / {cards.length}
              </div>
              <Button
                type="button"
                onClick={() => goToCard(currentIndex + 1)}
                disabled={currentIndex === cards.length - 1}
              >
                Next
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <Button type="button" variant="secondary" onClick={shuffleDeck}>
                <Shuffle className="h-4 w-4" aria-hidden="true" />
                Shuffle
              </Button>
              <Button type="button" variant="secondary" onClick={restartDeck}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Restart
              </Button>
              <Button
                type="button"
                onClick={saveDeck}
                disabled={isSaving || Boolean(savedDeckId)}
              >
                {isSaving ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="h-4 w-4" aria-hidden="true" />
                )}
                {savedDeckId ? "Saved" : "Save"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={copyAll}
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
              <Button type="button" variant="ghost" onClick={() => generateDeck()}>
                <Layers className="h-4 w-4" aria-hidden="true" />
                Regenerate
              </Button>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={BrainCircuit}
            title="No flashcards generated yet"
            description="Enter a topic or paste notes, choose a deck size, then generate your flashcards."
            className="min-h-[32rem]"
          />
        )}
      </Surface>
    </div>
  );
}
