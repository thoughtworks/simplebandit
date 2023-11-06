import { ISimpleOracleState } from "./ISimpleOracle";

export type IBanditState = {
  temperature: number;
};

export interface ISimpleBanditState extends IBanditState {
  oracleState: ISimpleOracleState;
}

export interface IMultiBanditState extends ISimpleBanditState {
  nRecommendations: number;
}

export type WeightedOracleState = {
  oracleState: ISimpleOracleState;
  weight: number;
};

export interface IWeightedBanditState extends IBanditState {
  oraclesStates: WeightedOracleState[];
}

export interface IWeightedMultiBanditState extends IWeightedBanditState {
  nRecommendations: number;
}
