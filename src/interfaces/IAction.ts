import { FeaturesHash } from "./IBandits";

export interface IAction {
  actionId: string;
  features: FeaturesHash;
  selectedCount?: number;
}

export interface IScoredAction {
  actionId: string;
  score: number;
  probability: number;
  selectedCount?: number;
}
