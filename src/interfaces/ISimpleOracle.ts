import { ISimpleOracleState } from "./IState";
import { ITrainingData } from "./ITrainingData";

export interface ISimpleOracle {
  actionIds?: string[];
  context?: string[];
  actionFeatures?: string[];
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
    contextInputs: { [feature: string]: number },
    actionInputs: { [feature: string]: number },
  ): number;

  fit(trainingData: ITrainingData | ITrainingData[]): void;
}
