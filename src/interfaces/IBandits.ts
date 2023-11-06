export type FeaturesHash = { [feature: string]: number };

// import { ISimpleOracleState, FeaturesHash } from "./ISimpleOracle";
// import { SimpleOracle } from "../SimpleOracle";
// import { IRecommendation } from "./IRecommendation";
// import { ITrainingData } from "./ITrainingData";
// import { IScoredAction } from "./IAction";

// export type ISimpleBanditState = {
//   oracleState: ISimpleOracleState;
//   temperature: number;
// };

// export interface ISimpleBandit {
//   oracle: SimpleOracle;
//   temperature: number;

//   toState(): ISimpleBanditState;
//   toJSON(): string;

//   getScoredActions(context: FeaturesHash): IScoredAction[];
//   recommend(context: FeaturesHash): IRecommendation;
//   accept(recommendation: IRecommendation): Promise<ITrainingData[]>;
//   reject(recommendation: IRecommendation): Promise<ITrainingData[]>;

//   train(trainingData: ITrainingData[]): Promise<void>;
// }

// import { ISimpleOracleState, FeaturesHash } from "./ISimpleOracle";
// import { SimpleOracle } from "../SimpleOracle";
// import { IMultiRecommendation } from "./IRecommendation";
// import { ITrainingData } from "./ITrainingData";

// export type IMultiBanditState = {
//   oracleState: ISimpleOracleState;
//   temperature: number;
//   nRecommendations: number;
// };

// export interface IMultiBandit {
//   oracle: SimpleOracle;
//   temperature: number;

//   toState(): IMultiBanditState;
//   toJSON(): string;

//   recommend(context: FeaturesHash): IMultiRecommendation;
//   choose(
//     recommendation: IMultiRecommendation,
//     actionId: string | undefined,
//   ): Promise<ITrainingData[]>;

//   rejectAll(recommendation: IMultiRecommendation): Promise<ITrainingData[]>;

//   train(trainingData: ITrainingData[]): Promise<void>;
// }


// import { ISimpleOracleState, FeaturesHash } from "./ISimpleOracle";
// import { SimpleOracle } from "../SimpleOracle";
// import { IRecommendation, IMultiRecommendation } from "./IRecommendation";
// import { ITrainingData } from "./ITrainingData";
// import { IScoredAction } from "./IAction";

// export type WeightedOracle = { oracle: SimpleOracle; weight: number };
// export type WeightedOracleState = {
//   oracleState: ISimpleOracleState;
//   weight: number;
// };

// export type IWeightedMultiBanditState = {
//   oraclesStates: WeightedOracleState[];
//   temperature: number;
//   nRecommendations: number;
// };

// export interface IWeightedMultiBandit {
//   weightedOracles: WeightedOracle[];
//   temperature: number;

//   getWeightedMultiBanditState(): IWeightedMultiBanditState;
//   toJSON(): string;

//   getScoredActions(context: FeaturesHash): IRecommendedAction[]
//   getActionScoresPerOracle(
//     context: FeaturesHash
//   ): Array<{ [key: string]: number | string }>;

//   recommend(context: FeaturesHash): IMultiRecommendation;
//   choose(
//     recommendation: IMultiRecommendation,
//     actionId: string | undefined
//   ): Promise<ITrainingData[]>;

//   rejectAll(recommendation: IMultiRecommendation): Promise<ITrainingData[]>;
//   feedback(
//     recommendation: IMultiRecommendation,
//     actionId: string,
//     label: string,
//     value: number
//   ): Promise<ITrainingData[]>;

//   train(trainingData: ITrainingData[]): Promise<void>;
// }

// export type IWeightedBanditState = {
//   oraclesStates: WeightedOracleState[];
//   temperature: number;
// };

// export interface IWeightedBandit {
//   weightedOracles: WeightedOracle[];
//   temperature: number;

//   getWeightedBanditState(): IWeightedBanditState;
//   toJSON(): string;

//   getScoredActions(context: FeaturesHash): IScoredAction[];
//   getActionScoresPerOracle(
//     context: FeaturesHash
//   ): Array<{ [key: string]: number | string }>;

//   recommend(context: FeaturesHash): IRecommendation;
//   accept(recommendation: IRecommendation): Promise<ITrainingData[]>;
//   reject(recommendation: IRecommendation): Promise<ITrainingData[]>;

//   feedback(
//     recommendation: IRecommendation,
//     label: string,
//     value: number
//   ): Promise<ITrainingData[]>;

//   train(trainingData: ITrainingData[]): Promise<void>;
// }

