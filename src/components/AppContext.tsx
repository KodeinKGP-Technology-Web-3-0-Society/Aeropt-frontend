"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import appDataJson from "@/data/appData.json";

// Types derived from JSON schema
export type User = {
  name: string;
  badge: string;
  email: string;
};

export type DashboardStat = {
  id: string;
  label: string;
  value: string;
  subtext: string;
  list?: string[];
  dots?: boolean[];
};

export type Concept = {
  name: string;
  score: number;
  attempts: number;
  tag: string | null;
};

export type Chapter = {
  name: string;
  conceptCount: number;
  overallScore: number;
  concepts: Concept[];
};

export type ChatMessage = {
  id: string;
  sender: "user" | "bot";
  text?: string;
  isExplanation?: boolean;
  gapTitle?: string;
  gapDescription?: string;
  steps?: string[];
  keyInsight?: string;
  tryNext?: string[];
};

export type QuizStep = {
  title: string;
  topic: string;
  totalSteps: number;
  currentStep: number;
  subTitle: string;
  questionText: string;
  options: { label: string; value: string; text: string }[];
  hint: string;
  correctAnswer: string;
  weakPoint: { title: string; description: string };
};

export type PracticeQuestion = {
  id: string;
  questionNumber: number;
  totalQuestions: number;
  difficulty: number;
  chapter: string;
  type: string;
  source: string;
  text: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
  timeSpent: string;
  solution: string[];
  keyInsight: string;
};

export type AppDataState = {
  user: User;
  dashboard: {
    stats: DashboardStat[];
    conceptHealth: {
      title: string;
      tabs: string[];
      chapters: Chapter[];
    };
  };
  chat: {
    header: { title: string; concept: string; secondaryConcept: string };
    sidebar: {
      concepts: { name: string; score: number; status: string }[];
      prerequisites: { name: string; score: number; status: string }[];
    };
    conversation: ChatMessage[];
    diagnosticQuiz: QuizStep;
  };
  practice: {
    filters: { chapters: string[]; difficulties: string[]; types: string[] };
    questions: PracticeQuestion[];
  };
  progress: {
    subtitle: string;
    stats: DashboardStat[];
    mistakesDistribution: { type: string; count: number; percentage: number }[];
    proficiencyOverTime: {
      dates: string[];
      chapters: { name: string; data: number[] }[];
    };
    conceptBreakdownTable: {
      concept: string;
      chapter: string;
      score: number;
      attempts: number;
      accuracy: number;
      lastAttempted: string;
      trend: "up" | "down" | "flat";
    }[];
  };
};

type AppContextType = {
  isLoggedIn: boolean;
  login: (email: string) => void;
  logout: () => void;
  data: AppDataState;
  setData: React.Dispatch<React.SetStateAction<AppDataState>>;
  // Chat page states
  chatHistory: ChatMessage[];
  addChatMessage: (text: string) => void;
  quizActive: boolean;
  setQuizActive: (active: boolean) => void;
  quizStep: number; // 1 to 4
  setQuizStep: (step: number) => void;
  // Practice page states
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (idx: number) => void;
  selectedPracticeChapter: string;
  setSelectedPracticeChapter: (ch: string) => void;
  selectedPracticeDifficulty: string;
  setSelectedPracticeDifficulty: (diff: string) => void;
  selectedPracticeType: string;
  setSelectedPracticeType: (type: string) => void;
  prioritizeWeak: boolean;
  setPrioritizeWeak: (val: boolean) => void;
  appTheme: "light" | "dark";
  setAppTheme: (theme: "light" | "dark") => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [data, setData] = useState<AppDataState>(appDataJson as AppDataState);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(data.chat.conversation);
  const [quizActive, setQuizActive] = useState<boolean>(false);
  const [quizStep, setQuizStep] = useState<number>(2);

  // Practice state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedPracticeChapter, setSelectedPracticeChapter] = useState<string>("All");
  const [selectedPracticeDifficulty, setSelectedPracticeDifficulty] = useState<string>("All");
  const [selectedPracticeType, setSelectedPracticeType] = useState<string>("All");
  const [prioritizeWeak, setPrioritizeWeak] = useState<boolean>(false);

  const [appTheme, setAppTheme] = useState<"light" | "dark">("dark");

  // Sync auth and theme with localStorage on client load
  useEffect(() => {
    const authStatus = localStorage.getItem("prepwise_auth");
    if (authStatus === "true") {
      setIsLoggedIn(true);
    }
    const savedTheme = localStorage.getItem("prepwise_theme") as "light" | "dark" | null;
    if (savedTheme) {
      setAppTheme(savedTheme);
    }
  }, []);

  // Apply theme to DOM
  useEffect(() => {
    localStorage.setItem("prepwise_theme", appTheme);
    document.documentElement.setAttribute("data-theme", appTheme);
    if (appTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, [appTheme]);

  const login = (email: string) => {
    setIsLoggedIn(true);
    localStorage.setItem("prepwise_auth", "true");
    // Update user email in our state if desired
    setData((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        email: email || prev.user.email,
      },
    }));
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("prepwise_auth");
  };

  const addChatMessage = (text: string) => {
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: "user",
      text,
    };

    setChatHistory((prev) => [...prev, userMsg]);

    // Simulate smart bot response based on keywords
    setTimeout(() => {
      let botMsg: ChatMessage;
      const cleanText = text.toLowerCase();

      if (cleanText.includes("torque") && cleanText.includes("moment of inertia")) {
        botMsg = {
          id: Math.random().toString(),
          sender: "bot",
          isExplanation: true,
          gapTitle: "LINKING CONCEPTS",
          gapDescription: "Torque (τ) causes angular acceleration (α), while Moment of Inertia (I) resists it. This relationship is the rotational analogue of Newton's Second Law (F = ma) and is given by $\\tau = I\\alpha$.",
          steps: [
            "Torque is the rotational force: $\\tau = r F \\sin\\theta$.",
            "Moment of Inertia represents the mass distribution: $I = \\sum m_i r_i^2$.",
            "Equating them gives the angular acceleration: $\\alpha = \\frac{\\tau}{I}$."
          ],
          keyInsight: "To accelerate an object rotationally, you must apply torque. A larger moment of inertia requires a larger torque for the same angular acceleration.",
          tryNext: [
            "What happens if the mass is concentrated closer to the axis of rotation?",
            "Can a body have zero net torque but non-zero net force?"
          ]
        };
      } else if (cleanText.includes("30") || cleanText.includes("angle")) {
        botMsg = {
          id: Math.random().toString(),
          sender: "bot",
          isExplanation: true,
          gapTitle: "RESOLVING FORCE AT AN ANGLE",
          gapDescription: "When the force is applied at an angle θ with the position vector, only the perpendicular component of the force ($F \\sin\\theta$) contributes to the torque.",
          steps: [
            "Given force $F = 10\\text{ N}$, distance $r = 0.5\\text{ m}$, and angle $\\theta = 30^\\circ$.",
            "Formula: $\\tau = r F \\sin\\theta$.",
            "Substitute values: $\\tau = 0.5 \\times 10 \\times \\sin(30^\\circ) = 5 \\times 0.5 = 2.5\\text{ N}\\cdot\\text{m}$."
          ],
          keyInsight: "Applying force perpendicular to the wrench ($\\theta = 90^\\circ$) is the most efficient way to generate torque since $\\sin(90^\\circ) = 1$. At $\\theta = 0^\\circ$, torque is zero.",
          tryNext: [
            "Why is the sign of this torque counter-clockwise?",
            "How does this change if we double the distance?"
          ]
        };
      } else {
        botMsg = {
          id: Math.random().toString(),
          sender: "bot",
          text: `Thanks for asking about "${text}". Let me review this concept. I've flagged this topic under **${data.chat.header.concept}** for a quick diagnostic quiz to verify your foundation.`,
          tryNext: [
            "Start diagnostic quiz on Torque",
            "Show me another practice question from HCV"
          ]
        };
      }

      setChatHistory((prev) => [...prev, botMsg]);
    }, 1200);
  };

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        login,
        logout,
        data,
        setData,
        chatHistory,
        addChatMessage,
        quizActive,
        setQuizActive,
        quizStep,
        setQuizStep,
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
        appTheme,
        setAppTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
