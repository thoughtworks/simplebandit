import { ISimpleOracleState } from "./IState";
import { ITrainingData } from "./ITrainingData";

export interface ISimpleOracle {
  actionIds?: string[];
  context?: string[];
  features?: string[];
  addIntercept: boolean;
  learningRate: number;
  actionIdFeatures: boolean;
  contextActionIdInteractions: boolean;
  contextActionFeatureInteractions: boolean;
  useInversePropensityWeighting: boolean;
  targetLabel: string;
  name: string;
  oracleWeight: number;
  weights: { [feature: string]: number };

  getOracleState(): ISimpleOracleState;
  toJSON(): string;

  predict(
    actionId: string,
    context: { [feature: string]: number },
    features: { [feature: string]: number },
  ): number;

  fit(trainingData: ITrainingData | ITrainingData[]): void;
}
