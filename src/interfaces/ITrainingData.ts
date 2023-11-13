export interface ITrainingData {
  actionId: string;
  probability: number;
  features?: Record<string, number> | undefined;
  context?: Record<string, number> | undefined;
  click?: number | undefined;
  [key: string]: any;
}
