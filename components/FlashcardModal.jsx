"use client";

import { ChevronLeft, ChevronRight, RotateCcw, X } from "lucide-react";
import { useState } from "react";

export default function FlashcardModal({ cards, noteTitle, onClose }) {
  const safeCards = Array.isArray(cards) ? cards : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const currentCard = safeCards[currentIndex];

  function goToCard(nextIndex) {
    setCurrentIndex(nextIndex);
    setIsFlipped(false);
  }

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-card p-4 shadow-card dark:border-white/10 dark:bg-background sm:p-6">
        <div className="flex flex-col gap-4 border-b border-border pb-4 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-wide text-primary dark:text-primary">
              Flashcards
            </p>
            <h2 className="mt-2 break-words text-2xl font-bold text-text dark:text-text">
              {noteTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted dark:text-muted">
              Tap the card to flip between concept and explanation.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-muted transition hover:bg-primary/10 hover:text-primary-hover dark:border-white/10 dark:text-text dark:hover:bg-card/10"
            aria-label="Close flashcards"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {currentCard ? (
          <>
            <button
              type="button"
              onClick={() => setIsFlipped((currentValue) => !currentValue)}
              className="mt-6 block w-full text-left [perspective:1200px]"
              aria-label="Flip flashcard"
            >
              <div
                className={`relative min-h-72 rounded-2xl transition duration-500 [transform-style:preserve-3d] ${
                  isFlipped ? "[transform:rotateY(180deg)]" : ""
                }`}
              >
                <div className="absolute inset-0 rounded-2xl border border-border bg-primary p-6 text-white shadow-lg shadow-primary/20 [backface-visibility:hidden]">
                  <p className="text-sm font-bold uppercase tracking-wide text-white/80">
                    Front
                  </p>
                  <div className="mt-8 flex min-h-40 items-center justify-center text-center">
                    <p className="break-words text-2xl font-bold leading-snug [overflow-wrap:anywhere]">
                      {currentCard.front_text}
                    </p>
                  </div>
                </div>

                <div className="absolute inset-0 rounded-2xl border border-border bg-card p-6 text-text shadow-lg shadow-card [backface-visibility:hidden] [transform:rotateY(180deg)] dark:border-white/10 dark:bg-card dark:text-text dark:shadow-none">
                  <p className="text-sm font-bold uppercase tracking-wide text-primary dark:text-primary">
                    Back
                  </p>
                  <div className="mt-8 flex min-h-40 items-center justify-center text-center">
                    <p className="break-words text-lg font-semibold leading-8 [overflow-wrap:anywhere]">
                      {currentCard.back_text}
                    </p>
                  </div>
                </div>
              </div>
            </button>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => goToCard(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-bold text-primary-hover transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-primary dark:hover:bg-card/10 sm:w-auto"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Previous
              </button>

              <div className="flex items-center justify-center gap-3 text-sm font-bold text-muted dark:text-muted">
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {currentIndex + 1} / {safeCards.length}
              </div>

              <button
                type="button"
                onClick={() => goToCard(Math.min(safeCards.length - 1, currentIndex + 1))}
                disabled={currentIndex === safeCards.length - 1}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </>
        ) : (
          <div className="py-16 text-center text-sm font-bold text-muted dark:text-muted">
            No flashcards available.
          </div>
        )}
      </div>
    </div>
  );
}
