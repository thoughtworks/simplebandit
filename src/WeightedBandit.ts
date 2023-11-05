import { IAction, IScoredAction } from "./interfaces/IAction";
import {
  IRecommendation,
  IRecommendedAction,
} from "./interfaces/IRecommendation";
import { IWeightedBanditState, IWeightedBandit, WeightedOracle, WeightedOracleState } from "./interfaces/IWeightedBandits";
import {
  ConvertScoresToProbabilityDistribution,
  SampleFromProbabilityDistribution,
} from "./MathService";
import { ITrainingData } from "./interfaces/ITrainingData";
import { FeaturesHash } from "./interfaces/ISimpleOracle";
import { SimpleOracle } from "./SimpleOracle";

export class WeightedBandit implements IWeightedBandit {
  weightedOracles: WeightedOracle[];
  targetLabels: string[];
  actionsMap: Record<string, IAction>;
  temperature: number;

  constructor(
    weightedOracles: WeightedOracle[],
    actions: IAction[],
    temperature: number = 0.5,
  ) {
    this.weightedOracles = weightedOracles;
    const oracleWeights = Object.values(weightedOracles).map((oracle) => oracle.weight);
    if (oracleWeights.some((weight) => weight < 0)) {
      throw new Error("All weights in oracles must be positive numbers.");
    }
    this.targetLabels = Object.values(weightedOracles).map(
      (oracle) => oracle.oracle.targetLabel
    );
    this.actionsMap = actions.reduce((acc, obj) => {
      (acc as any)[obj.actionId] = obj;
      return acc;
    }, {});
    this.temperature = temperature;
  }

//   static fromContextAndActions({
//     context,
//     actions,
//     temperature = 5.0,
//     learningRate = 1.0,
//   }: {
//     context: string[];
//     actions: IAction[];
//     temperature?: number;
//     learningRate?: number;
//   }): ISimpleBandit {
//     const actionFeatures = [
//       ...new Set(actions.flatMap((action) => Object.keys(action.features))),
//     ];
//     const actionIds = actions.map((action) => action.actionId);
//     const banditOracle = new SimpleOracle({
//       actionIds: actionIds,
//       context: context,
//       actionFeatures: actionFeatures,
//       learningRate: learningRate,
//     });
//     return new SimpleBandit(banditOracle, actions, temperature);
//   }

//   static fromContextAndActionIds({
//     context,
//     actionIds,
//     temperature = 5.0,
//     learningRate = 1.0,
//   }: {
//     context: string[];
//     actionIds: string[];
//     temperature?: number;
//     learningRate?: number;
//   }): ISimpleBandit {
//     const actions = actionIds.map((actionId) => ({
//       actionId: actionId,
//       features: {},
//     }));
//     return SimpleBandit.fromContextAndActions({
//       context,
//       actions,
//       temperature,
//       learningRate,
//     });
//   }

//   static fromActions({
//     actions,
//     temperature = 5.0,
//     learningRate = 1.0,
//   }: {
//     actions: IAction[];
//     temperature?: number;
//     learningRate?: number;
//   }): ISimpleBandit {
//     const actionFeatures = [
//       ...new Set(actions.flatMap((action) => Object.keys(action.features))),
//     ];
//     const actionIds = actions.map((action) => action.actionId);
//     const banditOracle = new SimpleOracle({
//       actionIds: actionIds,
//       context: [],
//       actionFeatures: actionFeatures,
//       learningRate: learningRate,
//     });
//     return new SimpleBandit(banditOracle, actions, temperature);
//   }

//   static fromActionIds({
//     actionIds,
//     temperature = 5.0,
//     learningRate = 1.0,
//   }: {
//     actionIds: string[];
//     temperature?: number;
//     learningRate?: number;
//   }): ISimpleBandit {
//     const actions = actionIds.map((actionId) => ({
//       actionId: actionId,
//       features: {},
//     }));
//     return SimpleBandit.fromActions({ actions, temperature, learningRate });
//   }

  static fromJSON(json: string, actions: IAction[]): ISimpleBandit {
    const state = JSON.parse(json) as ISimpleBanditState;
    return SimpleBandit.fromSimpleBanditState(state, actions);
  }

  static fromWeightedBanditState(
    state: IWeightedBanditState,
    actions: IAction[]
  ): IWeightedBandit {
    const oracles: WeightedOracle[] = [];
    for (const oracle of state.oraclesStates) {
      oracles.push({
        oracle: SimpleOracle.fromOracleState(oracle.oracleState),
        weight: oracle.weight,
      });
    }
    const temperature = state.temperature;
    return new WeightedMultiBandit(oracles, actions, temperature);
  }

  getWeightedBanditState(): IWeightedBanditState {
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

  toJSON(): string {
    return JSON.stringify(this.getWeightedBanditState());
  }

  _sampleFromActionScores(actionScores: IRecommendedAction[]): number {
    const scores = actionScores.map((ex) => ex.score);
    const probabilities = ConvertScoresToProbabilityDistribution(
      scores,
      this.temperature
    );
    const sampleIndex = SampleFromProbabilityDistribution(probabilities);
    return sampleIndex;
  }

  _getActionScore(
    actionId: string,
    context: FeaturesHash,
    features: FeaturesHash
  ) {
    let actionScore = 0;
    for (const weightedOracle of this.weightedOracles) {
      actionScore +=
        weightedOracle.weight *
        weightedOracle.oracle.predict(actionId, context, features);
    }
    return actionScore;
  }

  getScoredActions(context: FeaturesHash = {}): IScoredAction[] {
    let scoredActions: IScoredAction[] = [];
    const actionIds = Object.keys(this.actionsMap);
    for (let i = 0; i < actionIds.length; i++) {
      const actionId = actionIds[i];
      const action = this.actionsMap[actionId];
      const actionScore = this._getActionScore(
        action.actionId,
        context,
        action.features
      );
      const softmaxNumerator = Math.exp(actionScore / this.temperature);
      scoredActions.push({
        actionId: actionId,
        score: actionScore,
        probability: softmaxNumerator,
      });
    }
    let SoftmaxDenominator = scoredActions.reduce(
      (a, b) => a + b.probability,
      0
    );
    scoredActions = scoredActions.map((ex) => ({
      actionId: ex.actionId,
      score: ex.score,
      probability: ex.probability / SoftmaxDenominator,
    }));
    return scoredActions;
  }

  getActionScoresPerOracle(
    context: FeaturesHash = {}
  ): Array<{ [key: string]: number | string }> {
    let actionScoresPerOracle: Array<{ [key: string]: number | string }> = [];
    for (const [actionId, action] of Object.entries(this.actionsMap)) {
      for (const weightedOracle of this.weightedOracles) {
        const score = weightedOracle.oracle.predict(
          actionId,
          context,
          action.features
        );
        actionScoresPerOracle.push({
          actionId: actionId,
          [weightedOracle.oracle.targetLabel]: score,
          weight: weightedOracle.weight,
        });
      }
    }
    return actionScoresPerOracle;
  }

  recommend(context: FeaturesHash = {}): IRecommendation {
    let scoredActions = this.getScoredActions(context);
    const sampleIndex = this._sampleFromActionScores(scoredActions);
    const recommendedAction = scoredActions[sampleIndex];

    const recommendation: IRecommendation = {
      context: context,
      actionId: recommendedAction.actionId,
      score: recommendedAction.score,
      probability: recommendedAction.probability,
    };
    return recommendation;
  }

  _generateOracleTrainingData(
    recommendation: IRecommendation,
    selectedActionId: string | undefined = undefined
  ): ITrainingData[] {
    let trainingData: ITrainingData[] = [
      {
        actionId: recommendation.actionId,
        actionFeatures: this.actionsMap[recommendation.actionId].features,
        context: recommendation.context,
        click: recommendation.actionId === selectedActionId ? 1 : 0,
        probability: recommendation.probability,
      },
    ];
    return trainingData;
  }

  accept(recommendation: IRecommendation): Promise<ITrainingData[]> {
    return new Promise((resolve, reject) => {
      try {
        const trainingData = this._generateOracleTrainingData(
          recommendation,
          recommendation.actionId
        );
        this.train(trainingData);
        resolve(trainingData);
      } catch (error) {
        reject(error);
      }
    });
  }

  reject(recommendation: IRecommendation): Promise<ITrainingData[]> {
    return new Promise((resolve, reject) => {
      try {
        const trainingData = this._generateOracleTrainingData(
          recommendation,
          undefined
        );
        this.train(trainingData);
        resolve(trainingData);
      } catch (error) {
        reject(error);
      }
    });
  }

  feedback(
    recommendation: IRecommendation,
    label: string,
    value: number
  ): Promise<ITrainingData[]> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.targetLabels.includes(label)) {
          throw new Error(`label ${label} not in any of weightedOracles`);
        }
        const recommendedAction = this.actionsMap[recommendation.actionId];
        const probability = recommendation.probability;
        const trainingData: ITrainingData[] = [
          {
            actionId: recommendation.actionId,
            actionFeatures: recommendedAction.features,
            context: recommendation.context,
            [label]: value,
            probability: probability,
          },
        ];
        this.train(trainingData);
        resolve(trainingData);
      } catch (error) {
        reject(error);
      }
    });
  }

  train(trainingData: ITrainingData[]): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        for (let oracle of this.weightedOracles) {
            oracle.oracle.fitMany(trainingData);
          }
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
}
