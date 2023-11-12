import { WeightsHash } from "./IState";
import { ISimpleOracleState } from "./IState";
import { ITrainingData } from "./ITrainingData";

export type FeaturesHash = { [feature: string]: number };

export interface SimpleOracleOptions {
  actionIds?: string[];
  context?: string[];
  actionFeatures?: string[];
  learningRate?: number;
  contextActionIdInteractions?: boolean;
  contextActionFeatureInteractions?: boolean;
  useInversePropensityWeighting?: boolean;
  negativeClassWeight?: number;
  targetLabel?: string;
  strictFeatures?: boolean;
  name?: string;
  oracleWeight?: number;
  weights?: WeightsHash;
}

export interface ISimpleOracle {
  actionIds: string[];
  context: string[];
  actionFeatures: string[];
  addIntercept: boolean;
  learningRate: number;
  contextActionIdInteractions: boolean;
  contextActionFeatureInteractions: boolean;
  useInversePropensityWeighting: boolean;
  negativeClassWeight: number;
  targetLabel: string;
  strictFeatures: boolean;
  name: string;
  oracleWeight: number;
  weights: number[];

  getOracleState(): ISimpleOracleState;
  toJSON(): string;

  setFeaturesAndUpdateWeights(
    actionIds?: string[],
    context?: string[],
    actionFeatures?: string[],
    contextActionIdInteractions?: boolean,
    contextActionFeatureInteractions?: boolean,
    weights?: WeightsHash,
  ): void;

  getWeightsHash(): WeightsHash;
  getWeightsMap(round: number): Map<string, string>;
  predict(
    actionId: string,
    contextInputs: FeaturesHash,
    actionInputs: FeaturesHash,
  ): number;

  fit(trainingData: ITrainingData): void;
  fitMany(trainingData: ITrainingData[]): void;
}
