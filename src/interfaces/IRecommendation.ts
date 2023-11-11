import { FeaturesHash } from "./ISimpleOracle";

export interface IRecommendation {
  context: FeaturesHash;
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
  context: FeaturesHash;
  slateActions: Array<ISlateAction>;
}
