import { IAction } from "./interfaces/IAction";
import { SimpleOracle } from "./SimpleOracle";
import {
  SingleOracleBandit,
  WeightedOracle,
  BaseWeightedBandit,
} from "./BaseBandits";
import { SimpleBanditMixin, MultiBanditMixin } from "./BanditMixins";
import {
  ISimpleBanditState,
  IMultiBanditState,
  IWeightedBanditState,
  IWeightedMultiBanditState,
  WeightedOracleState,
} from "./interfaces/IState";

export class SimpleBandit extends SimpleBanditMixin(SingleOracleBandit) {
  static fromContextAndActions({
    context,
    actions,
    temperature = 5.0,
    learningRate = 1.0,
  }: {
    context: string[];
    actions: IAction[];
    temperature?: number;
    learningRate?: number;
  }): SimpleBandit {
    const actionFeatures = [
      ...new Set(actions.flatMap((action) => Object.keys(action.features))),
    ];
    const actionIds = actions.map((action) => action.actionId);
    const banditOracle = new SimpleOracle({
      actionIds: actionIds,
      context: context,
      actionFeatures: actionFeatures,
      learningRate: learningRate,
    });
    return new SimpleBandit(banditOracle, actions, temperature);
  }

  static fromContextAndActionIds({
    context,
    actionIds,
    temperature = 5.0,
    learningRate = 1.0,
  }: {
    context: string[];
    actionIds: string[];
    temperature?: number;
    learningRate?: number;
  }): SimpleBandit {
    const actions = actionIds.map((actionId) => ({
      actionId: actionId,
      features: {},
    }));
    return SimpleBandit.fromContextAndActions({
      context,
      actions,
      temperature,
      learningRate,
    });
  }

  static fromActions({
    actions,
    temperature = 5.0,
    learningRate = 1.0,
  }: {
    actions: IAction[];
    temperature?: number;
    learningRate?: number;
  }): SimpleBandit {
    const actionFeatures = [
      ...new Set(actions.flatMap((action) => Object.keys(action.features))),
    ];
    const actionIds = actions.map((action) => action.actionId);
    const banditOracle = new SimpleOracle({
      actionIds: actionIds,
      context: [],
      actionFeatures: actionFeatures,
      learningRate: learningRate,
    });
    return new SimpleBandit(banditOracle, actions, temperature);
  }

  static fromActionIds({
    actionIds,
    temperature = 5.0,
    learningRate = 1.0,
  }: {
    actionIds: string[];
    temperature?: number;
    learningRate?: number;
  }): SimpleBandit {
    const actions = actionIds.map((actionId) => ({
      actionId: actionId,
      features: {},
    }));
    return SimpleBandit.fromActions({ actions, temperature, learningRate });
  }

  toState(): ISimpleBanditState {
    return {
      oracleState: this.oracle.getOracleState(),
      temperature: this.temperature,
    };
  }

  static fromSimpleBanditState(
    state: ISimpleBanditState,
    actions: IAction[]
  ): SimpleBandit {
    const banditOracle = SimpleOracle.fromOracleState(state.oracleState);

    const temperature = state.temperature;
    return new SimpleBandit(banditOracle, actions, temperature);
  }

  static fromJSON(json: string, actions: IAction[]): SimpleBandit {
    const state = JSON.parse(json) as ISimpleBanditState;
    return SimpleBandit.fromSimpleBanditState(state, actions);
  }
}

export class MultiBandit extends MultiBanditMixin(SingleOracleBandit) {
  constructor(
    oracle: SimpleOracle,
    actions: IAction[],
    temperature: number = 0.5,
    nRecommendations: number = 1
  ) {
    super(oracle, actions, temperature);
    this.nRecommendations = nRecommendations;
  }

  static fromContextAndActions({
    context,
    actions,
    temperature = 5.0,
    learningRate = 1.0,
    nRecommendations = 3,
  }: {
    context: string[];
    actions: IAction[];
    temperature?: number;
    learningRate?: number;
    nRecommendations?: number;
  }): MultiBandit {
    const oracle = new SimpleOracle({
      actionIds: actions.map((action) => action.actionId),
      context: context,
      actionFeatures: [
        ...new Set(actions.flatMap((action) => Object.keys(action.features))),
      ],
      learningRate: learningRate,
    });
    return new MultiBandit(oracle, actions, temperature, nRecommendations);
  }

  static fromContextAndActionIds({
    context,
    actionIds,
    temperature = 5.0,
    learningRate = 1.0,
    nRecommendations = 3,
  }: {
    context: string[];
    actionIds: string[];
    temperature?: number;
    learningRate?: number;
    nRecommendations?: number;
  }): MultiBandit {
    return MultiBandit.fromContextAndActions({
      context: context,
      actions: actionIds.map((actionId) => ({
        actionId: actionId,
        features: {},
      })),
      temperature: temperature,
      learningRate: learningRate,
      nRecommendations: nRecommendations,
    });
  }

  static fromActions({
    actions,
    temperature = 5.0,
    learningRate = 1.0,
    nRecommendations = 3,
  }: {
    actions: IAction[];
    temperature?: number;
    learningRate?: number;
    nRecommendations?: number;
  }): MultiBandit {
    const oracle = new SimpleOracle({
      actionIds: actions.map((action) => action.actionId),
      actionFeatures: [
        ...new Set(actions.flatMap((action) => Object.keys(action.features))),
      ],
      learningRate: learningRate,
    });
    return new MultiBandit(oracle, actions, temperature, nRecommendations);
  }

  static fromActionIds({
    actionIds,
    temperature = 5.0,
    learningRate = 1.0,
    nRecommendations = 3,
  }: {
    actionIds: string[];
    temperature?: number;
    learningRate?: number;
    nRecommendations?: number;
  }): MultiBandit {
    return MultiBandit.fromActions({
      actions: actionIds.map((actionId) => ({
        actionId: actionId,
        features: {},
      })),
      temperature: temperature,
      learningRate: learningRate,
      nRecommendations: nRecommendations,
    });
  }

  static fromJSON(json: string, actions: IAction[]): MultiBandit {
    const state = JSON.parse(json) as IMultiBanditState;
    return MultiBandit.fromState(state, actions);
  }

  static fromState(state: IMultiBanditState, actions: IAction[]): MultiBandit {
    const oracle = SimpleOracle.fromOracleState(state.oracleState);
    const temperature = state.temperature;
    const nRecommendations = state.nRecommendations;
    return new MultiBandit(oracle, actions, temperature, nRecommendations);
  }

  toState(): IMultiBanditState {
    return {
      oracleState: this.oracle.getOracleState(),
      temperature: this.temperature,
      nRecommendations: this.nRecommendations,
    };
  }
}

export class WeightedBandit extends SimpleBanditMixin(BaseWeightedBandit) {
  toState(): IWeightedBanditState {
    const oraclesStates: WeightedOracleState[] = [];
    for (const weightedOracle of this.weightedOracles) {
      oraclesStates.push({
        weight: weightedOracle.weight,
        oracleState: weightedOracle.oracle.getOracleState(),
      });
    }
    return {
      oraclesStates: oraclesStates,
      temperature: this.temperature,
    };
  }

  static fromState(
    state: IWeightedBanditState,
    actions: IAction[]
  ): WeightedBandit {
    const oracles: WeightedOracle[] = [];
    for (const oracle of state.oraclesStates) {
      oracles.push({
        oracle: SimpleOracle.fromOracleState(oracle.oracleState),
        weight: oracle.weight,
      });
    }
    const temperature = state.temperature;
    return new WeightedBandit(oracles, actions, temperature);
  }

  static fromJSON(json: string, actions: IAction[]): WeightedBandit {
    const state = JSON.parse(json) as IWeightedBanditState;
    return WeightedBandit.fromState(state, actions);
  }
}

export class WeightedMultiBandit extends MultiBanditMixin(BaseWeightedBandit) {
  constructor(
    weightedOracles: WeightedOracle[],
    actions: IAction[],
    temperature: number = 0.5,
    nRecommendations: number = 3
  ) {
    super(weightedOracles, actions, temperature);
    this.nRecommendations = nRecommendations;
  }

  static fromJSON(json: string, actions: IAction[]): WeightedMultiBandit {
    const state = JSON.parse(json) as IWeightedMultiBanditState;
    return WeightedMultiBandit.fromState(state, actions);
  }

  static fromState(
    state: IWeightedMultiBanditState,
    actions: IAction[]
  ): WeightedMultiBandit {
    const oracles: WeightedOracle[] = [];
    for (const oracle of state.oraclesStates) {
      oracles.push({
        oracle: SimpleOracle.fromOracleState(oracle.oracleState),
        weight: oracle.weight,
      });
    }
    const temperature = state.temperature;
    const nRecommendations = state.nRecommendations;
    return new WeightedMultiBandit(
      oracles,
      actions,
      temperature,
      nRecommendations
    );
  }

  toState(): IWeightedMultiBanditState {
    const oraclesStates: WeightedOracleState[] = [];
    for (const weightedOracle of this.weightedOracles) {
      oraclesStates.push({
        weight: weightedOracle.weight,
        oracleState: weightedOracle.oracle.getOracleState(),
      });
    }
    return {
      oraclesStates: oraclesStates,
      temperature: this.temperature,
      nRecommendations: this.nRecommendations,
    };
  }
}
