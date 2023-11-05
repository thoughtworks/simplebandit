export interface ITrainingData {
  actionId: string;
  actionFeatures?: Record<string, number> | undefined;
  context?: Record<string, number> | undefined;
  click?: number | undefined;
  probability?: number | undefined;
  [key: string]: any;
}
