import {ISimpleOracleState, FeaturesHash} from './ISimpleOracle';
import {SimpleOracle} from '../SimpleOracle';
import {IMultiRecommendation} from './IRecommendation';
import {ITrainingData} from './ITrainingData';

export type IMultiBanditState = {
    oracleState: ISimpleOracleState;
    temperature: number;
    nRecommendations: number;
  };
  
  
export interface IMultiBandit {
  
    oracle: SimpleOracle;
    temperature: number;
  
    getMultiBanditState(): IMultiBanditState;
    toJSON(): string;
  
    makeRecommendation(context: FeaturesHash): IMultiRecommendation;
    chooseAction(
      recommendation: IMultiRecommendation,
      actionId: string | undefined,
    ): Promise<ITrainingData[]>;

    rejectAll(recommendation: IMultiRecommendation): Promise<ITrainingData[]>;
  
    train(trainingData: ITrainingData[]): Promise<void>;
  }