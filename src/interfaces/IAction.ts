export interface IAction {
  actionId: string;
  features: { [feature: string]: number };
  clickCount?: number;
}

export interface IScoredAction {
  actionId: string;
  score: number;
  probability: number;
}
