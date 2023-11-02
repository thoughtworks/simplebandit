export interface ITrainingData {
    actionId: string;
    actionFeatures?: Record<string, number> | undefined;
    context?: Record<string, number> | undefined;
    label?: number | undefined;
    probability?: number | undefined;
}