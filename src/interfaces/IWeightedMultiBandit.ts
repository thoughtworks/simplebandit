import { ISimpleOracleState, FeaturesHash } from "./ISimpleOracle";
import { SimpleOracle } from "../SimpleOracle";
import { IMultiRecommendation } from "./IRecommendation";
import { ITrainingData } from "./ITrainingData";

export type WeightedOracle = { oracle: SimpleOracle, weight: number };
export type WeightedOracleState = { oracleState: ISimpleOracleState, weight: number };

export type IWeightedMultiBanditState = {
  oraclesStates: WeightedOracleState[];
  temperature: number;
  nRecommendations: number;
};

export interface IWeightedMultiBandit {
  weightedOracles: WeightedOracle[];
  temperature: number;

  getWeightedMultiBanditState(): IWeightedMultiBanditState;
  toJSON(): string;

  recommend(context: FeaturesHash): IMultiRecommendation;
  choose(
    recommendation: IMultiRecommendation,
    actionId: string | undefined,
  ): Promise<ITrainingData[]>;

  rejectAll(recommendation: IMultiRecommendation): Promise<ITrainingData[]>;
  feedback(
    recommendation: IMultiRecommendation,
    actionId: string,
    label: string,
    value: number,
  ): Promise<ITrainingData[]>;

  train(trainingData: ITrainingData[]): Promise<void>;
}
