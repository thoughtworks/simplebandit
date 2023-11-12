import { ISimpleOracle } from "./ISimpleOracle";
import { FeaturesHash } from "./ISimpleOracle";
import { IAction } from "./IAction";
import { ITrainingData } from "./ITrainingData";
import { IScoredAction } from "./IAction";
import { ISimpleBanditState } from "./IState";
import { IRecommendation, ISlate } from "./IRecommendation";

export interface ISimpleBandit {
  oracles: ISimpleOracle[];
  targetLabels: string[];
  temperature: number;
  actionsMap: Record<string, IAction>;
  slateSize: number;

  toState(): ISimpleBanditState;
  toJSON(): string;

  recommend(context: FeaturesHash): IRecommendation;
  slate(context: FeaturesHash): ISlate;

  accept(recommendation: IRecommendation): Promise<ITrainingData[]>;
  choose(slate: ISlate, actionId: string): Promise<ITrainingData[]>;
  reject(recommendation: IRecommendation | ISlate): Promise<ITrainingData[]>;
  feedback(
    recommendation: IRecommendation | ISlate,
    label: string,
    value: number,
    actionId: string | undefined,
  ): Promise<ITrainingData[]>;

  getScoredActions(context: FeaturesHash): IScoredAction[];
  getScoredActionsPerOracle(
    context: FeaturesHash,
  ): Array<{ [key: string]: number | string }>;

  train(trainingData: ITrainingData[]): Promise<void>;
}
