import { questionTypesEnum } from "./db/schema.js";

export interface AssessmentTestItem {
    key: string;
    question: string;
    isPreliminary: boolean;
    isRequired: boolean;
    type: (typeof questionTypesEnum.enumValues)[number];
    options: Array<{ key: string, value: string }>;
    answer?: string | string[] | boolean;
    answeredAt?: string
}
