import { questionTypesEnum } from "./db/schema.js";

export function formatAnswer(
    answer: string[],
    questionType: (typeof questionTypesEnum.enumValues)[number]
): string | string[] | boolean {
    if (questionType == "YES_NO")
        return answer[0].trim() == 'true';
    if (questionType == 'YES_NO_TEXT')
        return answer[0];
    return answer;
}
