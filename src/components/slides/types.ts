export type SlideType = "concept" | "hook" | "formula" | "diagram" | "summary" | "problem" | "step" | "answer";

export type StudySlide = {
  id: string;
  type: SlideType | string;
  title: string;
  body_md: string;
  image_url?: string | null;
};

export type SlidesPayload = {
  mode: "theory" | "example" | string;
  slides: StudySlide[];
  current_index?: number;
};

export type StructuredLesson = {
  filling_gap: string;
  solution_steps: string[];
  insight: string;
};
