export enum ASSESSMENT_QUESTIONS {
    NAME = 'name',
    AGE = 'age'
}

import { questionTypesEnum } from "./db/schema.js";

export function formatAnswer(
    answer: string[],
    questionType: (typeof questionTypesEnum.enumValues)[number]
): string | string[] | boolean {
    if (questionType == "YES_NO")
        return answer?.[0]?.trim() == 'true';
    if (questionType == 'YES_NO_TEXT')
        return answer?.[0];
    return answer;
}

export const hasAnswer = (answer: unknown) =>
  answer !== null &&
  answer !== undefined &&
  answer !== '' &&
  !(Array.isArray(answer) && answer.length === 0);
  