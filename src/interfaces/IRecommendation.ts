export interface IRecommendation {
  recommendationId: string;
  context: { [feature: string]: number };
  actionId: string;
  score: number;
  probability: number;
}

export interface ISlateAction {
  actionId: string;
  score: number;
  probability: number;
}

export interface ISlate {
  recommendationId: string;
  context: { [feature: string]: number };
  slateActions: Array<ISlateAction>;
}
