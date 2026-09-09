"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, PracticeQuestion } from "@/components/AppContext";
import MarkdownMath from "@/components/MarkdownMath";

export default function PracticeContent() {
  const router = useRouter();
  const {
    data,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    selectedPracticeChapter,
    setSelectedPracticeChapter,
    selectedPracticeDifficulty,
    setSelectedPracticeDifficulty,
    selectedPracticeType,
    setSelectedPracticeType,
    prioritizeWeak,
    setPrioritizeWeak,
    addChatMessage,
  } = useApp();

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);

  const { filters, questions } = data.practice;

  // Filter logic
  const filteredQuestions = questions.filter((q) => {
    if (selectedPracticeChapter !== "All" && q.chapter !== selectedPracticeChapter) {
      return false;
    }
    if (selectedPracticeDifficulty !== "All" && q.difficulty.toString() !== selectedPracticeDifficulty) {
      return false;
    }
    if (selectedPracticeType !== "All" && q.type !== selectedPracticeType) {
      return false;
    }
    // If prioritizeWeak is active, only show weak concept chapters
    if (prioritizeWeak && q.chapter === "Work Energy") {
      return false; // Work Energy is strong in our JSON, Laws of Motion / Rotational Motion are weak
    }
    return true;
  });

  const activeQuestion: PracticeQuestion | undefined = filteredQuestions[currentQuestionIndex] || filteredQuestions[0];

  const handleOptionClick = (label: string) => {
    if (isAnswerChecked) return;
    setSelectedOption(label);
  };

  const handleCheckAnswer = () => {
    if (!selectedOption) return;
    setIsAnswerChecked(true);
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsAnswerChecked(false);
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setCurrentQuestionIndex(0); // Loop back
    }
  };

  const handleAskAboutThis = () => {
    if (!activeQuestion) return;
    addChatMessage(`Explain Question ${activeQuestion.questionNumber} from Practice: "${activeQuestion.text}"`);
    router.push("/chat");
  };

  return (
    <div className="flex-1 px-6 pb-6 pt-[6.75rem] lg:px-8 lg:pb-8 overflow-y-auto">
      {/* Filters Area */}
      <div className="bg-surface border border-line rounded-2xl p-5 shadow-lg mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Chapter Filter */}
          <div>
            <label className="block text-[10px] font-bold dark:text-muted text-muted uppercase tracking-wider mb-2">
              Chapter
            </label>
            <select
              value={selectedPracticeChapter}
              onChange={(e) => {
                setSelectedPracticeChapter(e.target.value);
                setCurrentQuestionIndex(0);
                setSelectedOption(null);
                setIsAnswerChecked(false);
              }}
              className="w-full bg-canvas border border-line focus:border-accent/80 text-xs text-ink rounded-lg p-2.5 outline-none transition-colors cursor-pointer"
            >
              {filters.chapters.map((ch) => (
                <option key={ch} value={ch}>
                  {ch === "Work Energy" ? "Work Energy & Power" : ch}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="block text-[10px] font-bold dark:text-muted text-muted uppercase tracking-wider mb-2">
              Difficulty
            </label>
            <select
              value={selectedPracticeDifficulty}
              onChange={(e) => {
                setSelectedPracticeDifficulty(e.target.value);
                setCurrentQuestionIndex(0);
                setSelectedOption(null);
                setIsAnswerChecked(false);
              }}
              className="w-full bg-canvas border border-line focus:border-accent/80 text-xs text-ink rounded-lg p-2.5 outline-none transition-colors cursor-pointer"
            >
              {filters.difficulties.map((diff) => (
                <option key={diff} value={diff}>
                  {diff === "All" ? "All Difficulties" : `Level ${diff}`}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-[10px] font-bold dark:text-muted text-muted uppercase tracking-wider mb-2">
              Type
            </label>
            <select
              value={selectedPracticeType}
              onChange={(e) => {
                setSelectedPracticeType(e.target.value);
                setCurrentQuestionIndex(0);
                setSelectedOption(null);
                setIsAnswerChecked(false);
              }}
              className="w-full bg-canvas border border-line focus:border-accent/80 text-xs text-ink rounded-lg p-2.5 outline-none transition-colors cursor-pointer"
            >
              {filters.types.map((t) => (
                <option key={t} value={t}>
                  {t === "All" ? "All Question Types" : t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Toggle prioritize weak concepts */}
        <div className="flex items-center justify-between border-t border-line/50 pt-4 mt-4">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wide">
            Prioritise weak concepts
          </span>
          <button
            onClick={() => {
              setPrioritizeWeak(!prioritizeWeak);
              setCurrentQuestionIndex(0);
              setSelectedOption(null);
              setIsAnswerChecked(false);
            }}
            className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
              prioritizeWeak ? "bg-success" : "bg-hover"
            }`}
          >
            <span
              className={`h-4.5 w-4.5 rounded-full bg-white transition-transform ${
                prioritizeWeak ? "translate-x-4.5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {activeQuestion ? (
        <>
          {/* Question Meta Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold text-accent uppercase tracking-widest">
              Question {activeQuestion.questionNumber} of {activeQuestion.totalQuestions}
            </span>
            <div className="h-1.5 w-32 bg-hover border border-line rounded-full overflow-hidden">
              <div
                className="h-full bg-accent"
                style={{ width: `${(activeQuestion.questionNumber / activeQuestion.totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card Box */}
          <div className="bg-surface border border-line rounded-2xl p-6 shadow-xl space-y-6">
            
            {/* Meta tags (Difficulty, Chapter, Type, Source) */}
            <div className="flex flex-wrap gap-2 select-none">
              <span className="text-[9px] font-bold text-muted border border-line bg-hover px-2 py-0.5 rounded">
                Level {activeQuestion.difficulty}
              </span>
              <span className="text-[9px] font-bold text-accent border border-accent/30 bg-hover/60 px-2 py-0.5 rounded">
                {activeQuestion.chapter}
              </span>
              <span className="text-[9px] font-bold text-emerald-400 border border-emerald-950 bg-emerald-950/20 px-2 py-0.5 rounded">
                {activeQuestion.type}
              </span>
              <span className="text-[9px] font-bold text-muted border border-line bg-hover px-2 py-0.5 rounded ml-auto">
                Source: {activeQuestion.source}
              </span>
            </div>

            {/* Question Text */}
            <div className="p-1">
              <p className="text-sm font-semibold dark:text-slate-100 text-ink leading-relaxed">
                {activeQuestion.text}
              </p>
            </div>

            {/* Multiple Choice Options */}
            <div className="grid grid-cols-1 gap-3.5">
              {activeQuestion.options.map((opt) => {
                const isSelected = selectedOption === opt.label;
                const isCorrect = opt.label === activeQuestion.correctAnswer;
                let optionClass = "border-line bg-canvas/40 text-ink-2 dark:hover:border-[#3d3d91] border-line/50 dark:hover:bg-[#101021] bg-hover/30";
                
                if (isAnswerChecked) {
                  if (isCorrect) {
                    optionClass = "border-emerald-500/40 bg-emerald-950/25 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.08)]";
                  } else if (isSelected) {
                    optionClass = "border-red-500/40 bg-red-950/25 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.08)]";
                  }
                } else if (isSelected) {
                  optionClass = "border-accent bg-hover text-ink shadow-none";
                }

                return (
                  <button
                    key={opt.label}
                    disabled={isAnswerChecked}
                    onClick={() => handleOptionClick(opt.label)}
                    className={`text-left p-4 border rounded-xl flex items-center gap-4 transition-all duration-200 font-sans cursor-pointer ${optionClass}`}
                  >
                    <span className={`h-6 w-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isSelected 
                        ? "bg-accent text-white" 
                        : "bg-hover dark:text-muted text-muted border border-line"
                    }`}>
                      {opt.label}
                    </span>
                    <MarkdownMath
                      content={opt.text}
                      className="markdown-math text-xs sm:text-[13px] font-semibold leading-relaxed flex-1"
                    />
                  </button>
                );
              })}
            </div>

            {/* Actions: Check Answer, Ask, Next Question */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-line/50">
              {!isAnswerChecked ? (
                <button
                  disabled={!selectedOption}
                  onClick={handleCheckAnswer}
                  className="w-full sm:flex-1 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-none cursor-pointer"
                >
                  Check Answer
                </button>
              ) : (
                <>
                  <button
                    onClick={handleAskAboutThis}
                    className="w-full sm:flex-1 bg-hover border border-accent/30 text-ink font-semibold text-xs uppercase tracking-wider py-3 rounded-xl hover:bg-hover transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="h-4.5 w-4.5 text-accent">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Ask about this
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    className="w-full sm:flex-1 bg-accent hover:bg-accent-hover text-white font-semibold text-xs uppercase tracking-wider py-3 rounded-xl transition-all shadow-none cursor-pointer"
                  >
                    Next Question
                  </button>
                </>
              )}
            </div>

            {/* Answer Feedbacks & Explanation Blocks */}
            {isAnswerChecked && (
              <div className="space-y-4 pt-4 border-t border-line/50 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    selectedOption === activeQuestion.correctAnswer 
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-500/20" 
                      : "bg-red-950 text-red-400 border border-red-500/20"
                  }`}>
                    {selectedOption === activeQuestion.correctAnswer ? "✓" : "✗"}
                  </span>
                  <span className="text-xs font-bold text-ink-2">
                    {selectedOption === activeQuestion.correctAnswer ? "Correct!" : "Incorrect Answer."}{" "}
                    <span className="text-[10px] dark:text-muted text-muted font-semibold uppercase ml-2 tracking-wider">
                      Time spent: {activeQuestion.timeSpent}
                    </span>
                  </span>
                </div>

                <div className="bg-canvas/60 border border-line rounded-xl p-4.5 space-y-3">
                  <h4 className="text-[11px] font-bold text-ink uppercase tracking-wider">Solution</h4>
                  <div className="space-y-2.5">
                    {activeQuestion.solution.map((step, idx) => (
                      <div key={idx} className="flex gap-2.5 items-start text-xs text-muted leading-relaxed font-medium">
                        <span className="h-4.5 w-4.5 rounded bg-hover border border-line text-accent text-[9.5px] font-bold flex items-center justify-center flex-none">
                          {idx + 1}
                        </span>
                        <div className="flex-1 mt-0.5">
                          <MarkdownMath
                            content={step}
                            className="markdown-math text-xs text-muted leading-relaxed font-medium"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-accent/5 border border-accent/15 rounded-xl p-4">
                  <h4 className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1 flex items-center gap-1.5 select-none">
                    <span>💡</span> KEY INSIGHT
                  </h4>
                  <p className="text-xs text-muted leading-relaxed font-semibold">
                    {activeQuestion.keyInsight}
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-surface border border-line rounded-2xl p-10 text-center shadow-lg">
          <span className="text-2xl">🔍</span>
          <h3 className="text-sm font-bold text-ink uppercase mt-4 mb-2">No Questions Match Filters</h3>
          <p className="text-xs dark:text-muted text-muted max-w-[320px] mx-auto leading-relaxed">
            Try resetting your chapter, difficulty level, or question type filters.
          </p>
        </div>
      )}
    </div>
  );
}
