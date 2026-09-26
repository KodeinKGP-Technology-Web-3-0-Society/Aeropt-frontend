"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildLessonUrl,
  buildTodayRoomUrl,
  completeClassroomToday,
  dismissClassroomToday,
  fetchClassroomHome,
  type ClassroomHome,
  type ClassroomToday,
  type ClassroomTodayDecision,
} from "@/lib/api/classroom";
import { ApiError } from "@/lib/api/auth";

const EMPTY_HOME: ClassroomHome = {
  today: null,
  plan: [],
  map: [],
  revise: [],
  readiness: { score: 0, label: "early" },
};

function normalizeHome(data: ClassroomHome): ClassroomHome {
  return {
    today: data.today ?? null,
    plan: data.plan ?? [],
    map: data.map ?? [],
    revise: data.revise ?? [],
    readiness: data.readiness ?? { score: 0, label: "early" },
  };
}

export function useHomeState() {
  const router = useRouter();
  const [home, setHome] = useState<ClassroomHome>(EMPTY_HOME);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClassroomHome(force);
      setHome(normalizeHome(data));
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load home";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openToday(today: ClassroomToday) {
    if (!today.concept_id) return;
    router.push(buildTodayRoomUrl(today));
  }

  function openLesson(conceptId: string) {
    if (!conceptId) return;
    router.push(buildLessonUrl(conceptId));
  }

  async function decideToday(decision: ClassroomTodayDecision) {
    const conceptId = home.today?.concept_id;
    if (!conceptId || actionPending) return;

    setActionPending(true);
    setActionError(null);
    try {
      const next =
        decision === "complete"
          ? await completeClassroomToday(conceptId)
          : await dismissClassroomToday(conceptId);
      if (next) {
        setHome(normalizeHome(next));
      } else {
        const data = await fetchClassroomHome(true);
        setHome(normalizeHome(data));
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : decision === "complete"
              ? "Failed to complete today"
              : "Failed to dismiss today";
      setActionError(message);
    } finally {
      setActionPending(false);
    }
  }

  return {
    home,
    loading,
    error,
    actionPending,
    actionError,
    reload: () => void load(true),
    openToday,
    openLesson,
    completeToday: () => void decideToday("complete"),
    dismissToday: () => void decideToday("dismiss"),
  };
}
