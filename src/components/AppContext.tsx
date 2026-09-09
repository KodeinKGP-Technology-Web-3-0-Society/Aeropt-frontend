"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import appDataJson from "@/data/appData.json";
import * as auth from "@/lib/auth";
import * as onboardingApi from "@/lib/onboarding";

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
  not_started?: boolean;
};

export type Chapter = {
  name: string;
  conceptCount: number;
  overallScore: number;
  concepts: Concept[];
};

export type PeerChapter = {
  chapter: string;
  ready: boolean;
  percentile: number | null;
  cohortSize: number;
  yourScore: number | null;
};

export type PeerComparison = {
  minCohort: number;
  chapters: PeerChapter[];
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
    peerComparison?: PeerComparison;
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
      chapters: { name: string; data: number[]; color?: string }[];
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
  authLoading: boolean;
  onboardingCompleted: boolean;
  onboardingLoading: boolean;
  refreshOnboardingStatus: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
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
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(true);
  const [onboardingLoading, setOnboardingLoading] = useState<boolean>(false);
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

  const [appTheme, setAppTheme] = useState<"light" | "dark">("light");
  const [themeReady, setThemeReady] = useState(false);

  const refreshOnboardingStatus = useCallback(async () => {
    if (!auth.isAuthenticated()) {
      setOnboardingCompleted(true);
      return;
    }
    setOnboardingLoading(true);
    try {
      const me = await onboardingApi.fetchMe();
      setOnboardingCompleted(me.onboarding_completed);
      if (me.supabase_user_id) {
        auth.storeSupabaseUserId(me.supabase_user_id);
      }
      if (me.email || me.full_name) {
        setData((prev) => ({
          ...prev,
          user: {
            ...prev.user,
            email: me.email || prev.user.email,
            name: me.full_name || prev.user.name,
          },
        }));
      }
    } catch {
      // Transient /auth/me failure: don't force a completed user back into
      // onboarding. Leave the current flag untouched so a network blip can't
      // trap them on the onboarding flow.
    } finally {
      setOnboardingLoading(false);
    }
  }, []);

  // Restore auth state from stored JWT on client load
  useEffect(() => {
    const restore = async () => {
      const loggedIn = auth.isAuthenticated();
      setIsLoggedIn(loggedIn);
      if (loggedIn) {
        await refreshOnboardingStatus();
      }
      setAuthLoading(false);
    };
    void restore();
  }, [refreshOnboardingStatus]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("prepwise_theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      setAppTheme(savedTheme);
    }
    setThemeReady(true);
  }, []);

  // Apply theme to DOM after restore so a first-paint default cannot wipe a saved preference.
  useEffect(() => {
    if (!themeReady) return;
    localStorage.setItem("prepwise_theme", appTheme);
    document.documentElement.setAttribute("data-theme", appTheme);
    if (appTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, [appTheme, themeReady]);

  const login = useCallback(async (email: string, password: string) => {
    await auth.login(email, password);
    setIsLoggedIn(true);
    setData((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        email: email || prev.user.email,
      },
    }));
    await refreshOnboardingStatus();
  }, [refreshOnboardingStatus]);

  const register = useCallback(async (email: string, password: string, fullName = "") => {
    await auth.register(email, password, fullName);
    setIsLoggedIn(true);
    setData((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        email: email || prev.user.email,
        name: fullName || prev.user.name,
      },
    }));
    await refreshOnboardingStatus();
  }, [refreshOnboardingStatus]);

  const logout = useCallback(async () => {
    await auth.logout();
    setIsLoggedIn(false);
    setOnboardingCompleted(true);
  }, []);

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
        authLoading,
        onboardingCompleted,
        onboardingLoading,
        refreshOnboardingStatus,
        login,
        register,
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
