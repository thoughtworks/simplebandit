export type WeightsHash = { [feature: string]: number };

export type ISimpleOracleState = {
  actionIds: string[];
  context: string[];
  actionFeatures: string[];
  learningRate: number;
  contextActionIdInteractions: boolean;
  contextActionFeatureInteractions: boolean;
  useInversePropensityWeighting: boolean;
  negativeClassWeight: number;
  targetLabel: string;
  strictFeatures: boolean;
  name: string;
  oracleWeight: number;
  weights: WeightsHash;
};

export type ISimpleBanditState = {
  oracleStates: ISimpleOracleState[];
  temperature: number;
  slateSize: number;
};
