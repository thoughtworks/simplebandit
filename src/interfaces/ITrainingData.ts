export interface ITrainingData {
  recommendationId: string;
  actionId: string;
  probability: number;
  sampleWeight?: number | undefined;
  features?: Record<string, number> | undefined;
  context?: Record<string, number> | undefined;
  click?: number | undefined;
  [key: string]: any;
}
