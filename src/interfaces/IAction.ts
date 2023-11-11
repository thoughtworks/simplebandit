import { FeaturesHash } from "./ISimpleOracle";

export interface IAction {
  actionId: string;
  features: FeaturesHash;
  clickCount?: number;
}

export interface IScoredAction {
  actionId: string;
  score: number;
  probability: number;
}
