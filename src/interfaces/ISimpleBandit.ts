import {ISimpleOracleState, FeaturesHash} from './ISimpleOracle';
import {SimpleOracle} from '../SimpleOracle';
import {IRecommendation} from './IRecommendation';
import {ITrainingData} from './ITrainingData';
import {IScoredAction} from './IAction';


export type ISimpleBanditState = {
  oracleState: ISimpleOracleState;
  softmaxBeta: number;
};


export interface ISimpleBandit {
  oracle: SimpleOracle;
  softmaxBeta: number;

  getSimpleBanditState(): ISimpleBanditState;
  toJSON(): string;

  getScoredActions(context: FeaturesHash): IScoredAction[];
  makeRecommendation(context: FeaturesHash): IRecommendation;
  acceptRecommendation(recommendation: IRecommendation): Promise<ITrainingData[]>;
  rejectRecommendation(recommendation: IRecommendation): Promise<ITrainingData[]>;

  train(trainingData: ITrainingData[]): Promise<void>;
}
