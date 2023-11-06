import { FeaturesHash } from "./IBandits";

export interface IRecommendation {
  context: FeaturesHash;
  actionId: string;
  score: number;
  probability: number;
}

export interface IRecommendedAction {
  actionId: string;
  score: number;
  probability: number;
}

export interface IMultiRecommendation {
  context: FeaturesHash;
  recommendedActions: Array<IRecommendedAction>;
}
