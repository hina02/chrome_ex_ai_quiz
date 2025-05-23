import { z } from "zod";

export const QuizSchema = z.object({
  question: z.string(),
  answer: z.string(),
  option: z.array(z.string()),
  explain: z.string(),
});
