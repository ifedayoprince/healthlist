import { questionTypesEnum } from "./db/schema.js";

export interface AssessmentTestItem {
    key: string;
    question: string;
    type: (typeof questionTypesEnum.enumValues)[number];
    options: Array<{ key: string, value: string }>;
    answer?: string | string[] | boolean;
    answeredAt?: string
}
