import { ISimpleOracle } from "./ISimpleOracle";
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

  recommend(
    context: { [feature: string]: number },
    options: { include?: string[], exclude?: string[] }
  ): IRecommendation;
  slate(
    context: { [feature: string]: number },
    options: { include?: string[], exclude?: string[] }
  ): ISlate;

  accept(recommendation: IRecommendation): Promise<ITrainingData[]>;
  choose(slate: ISlate, actionId: string): Promise<ITrainingData[]>;
  reject(recommendation: IRecommendation | ISlate): Promise<ITrainingData[]>;
  feedback(
    recommendation: IRecommendation | ISlate,
    label: string,
    value: number,
    actionId: string | undefined,
  ): Promise<ITrainingData[]>;

  getScoredActions(
    context: { [feature: string]: number },
    options: { include?: string[], exclude?: string[] }
  ): IScoredAction[];
  getScoredActionsPerOracle(
    context: {
      [feature: string]: number;
    },
    options: { include?: string[], exclude?: string[] }
  ): Array<{ [key: string]: number | string }>;

  train(trainingData: ITrainingData[]): Promise<void>;
}
