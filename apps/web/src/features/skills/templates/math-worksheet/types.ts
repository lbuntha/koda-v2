export interface MathWorksheetProblem {
    id: string;
    left: number;
    operator: '+' | '-';
    right: number;
}

export interface MathWorksheetPayload {
    layout: 'vertical' | 'horizontal';
    problems: MathWorksheetProblem[];
}

export interface MathWorksheetAnswer {
    values: Record<string, number>;
}
