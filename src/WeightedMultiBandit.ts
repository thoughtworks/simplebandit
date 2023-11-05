import { IAction, IScoredAction } from "./interfaces/IAction";
import {
  IMultiRecommendation,
  IRecommendedAction,
} from "./interfaces/IRecommendation";
import {
  WeightedOracle,
  WeightedOracleState,
  IWeightedMultiBanditState,
  IWeightedMultiBandit,
} from "./interfaces/IWeightedBandits";
import {
  ConvertScoresToProbabilityDistribution,
  SampleFromProbabilityDistribution,
} from "./MathService";
import { ITrainingData } from "./interfaces/ITrainingData";
import { FeaturesHash } from "./interfaces/ISimpleOracle";
import { SimpleOracle } from "./SimpleOracle";

export class WeightedMultiBandit implements IWeightedMultiBandit {
  weightedOracles: WeightedOracle[];
  targetLabels: string[];
  actionsMap: Record<string, IAction>;
  temperature: number;
  nRecommendations: number;

  constructor(
    weightedOracles: WeightedOracle[],
    actions: IAction[],
    temperature: number = 0.5,
    nRecommendations: number = 3
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
    this.nRecommendations = nRecommendations;
  }

  //   static fromContextAndActions({
  //     context,
  //     actions,
  //     temperature = 5.0,
  //     learningRate = 1.0,
  //     nRecommendations = 3,
  //   }: {
  //     context: string[];
  //     actions: IAction[];
  //     temperature?: number;
  //     learningRate?: number;
  //     nRecommendations?: number;
  //   }): IMultiBandit {
  //     const actionFeatures = [
  //       ...new Set(actions.flatMap((action) => Object.keys(action.features))),
  //     ];
  //     const actionIds = actions.map((action) => action.actionId);
  //     const oracle = new SimpleOracle({
  //       actionIds: actionIds,
  //       context: context,
  //       actionFeatures: actionFeatures,
  //       learningRate: learningRate,
  //     });
  //     return new MultiBandit(oracle, actions, temperature, nRecommendations);
  //   }

  //   static fromContextAndActionIds({
  //     context,
  //     actionIds,
  //     temperature = 5.0,
  //     learningRate = 1.0,
  //     nRecommendations = 3,
  //   }: {
  //     context: string[];
  //     actionIds: string[];
  //     temperature?: number;
  //     learningRate?: number;
  //     nRecommendations?: number;
  //   }): IMultiBandit {
  //     const actions = actionIds.map((actionId) => ({
  //       actionId: actionId,
  //       features: {},
  //     }));
  //     return MultiBandit.fromContextAndActions({
  //       context: context,
  //       actions: actions,
  //       temperature: temperature,
  //       learningRate: learningRate,
  //       nRecommendations: nRecommendations,
  //     });
  //   }

  //   static fromActions({
  //     actions,
  //     temperature = 5.0,
  //     learningRate = 1.0,
  //     nRecommendations = 3,
  //   }: {
  //     actions: IAction[];
  //     temperature?: number;
  //     learningRate?: number;
  //     nRecommendations?: number;
  //   }): IMultiBandit {
  //     const actionFeatures = [
  //       ...new Set(actions.flatMap((action) => Object.keys(action.features))),
  //     ];
  //     const actionIds = actions.map((action) => action.actionId);
  //     const oracle = new SimpleOracle({
  //       actionIds: actionIds,
  //       actionFeatures: actionFeatures,
  //       learningRate: learningRate,
  //     });
  //     return new MultiBandit(oracle, actions, temperature, nRecommendations);
  //   }

  //   static fromActionIds({
  //     actionIds,
  //     temperature = 5.0,
  //     learningRate = 1.0,
  //     nRecommendations = 3,
  //   }: {
  //     actionIds: string[];
  //     temperature?: number;
  //     learningRate?: number;
  //     nRecommendations?: number;
  //   }): IMultiBandit {
  //     const actions = actionIds.map((actionId) => ({
  //       actionId: actionId,
  //       features: {},
  //     }));
  //     return MultiBandit.fromActions({
  //       actions: actions,
  //       temperature: temperature,
  //       learningRate: learningRate,
  //       nRecommendations: nRecommendations,
  //     });
  //   }

  static fromJSON(json: string, actions: IAction[]): IWeightedMultiBandit {
    const state = JSON.parse(json) as IWeightedMultiBanditState;
    return WeightedMultiBandit.fromWeightedMultiBanditState(state, actions);
  }

  static fromWeightedMultiBanditState(
    state: IWeightedMultiBanditState,
    actions: IAction[]
  ): IWeightedMultiBandit {
    const oracles: WeightedOracle[] = [];
    for (const oracle of state.oraclesStates) {
      oracles.push({
        oracle: SimpleOracle.fromOracleState(oracle.oracleState),
        weight: oracle.weight,
      });
    }
    const temperature = state.temperature;
    const nRecommendations = state.nRecommendations;
    return new WeightedMultiBandit(oracles, actions, temperature, nRecommendations);
  }

  getWeightedMultiBanditState(): IWeightedMultiBanditState {
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

  toJSON(): string {
    return JSON.stringify(this.getWeightedMultiBanditState());
  }

  private _sampleFromActionScores(actionScores: IRecommendedAction[]): number {
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

  getScoredActions(context: FeaturesHash = {}): IScoredAction {
    let scoredActions: IScoredAction = [];

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

  recommend(context: FeaturesHash = {}): IMultiRecommendation {
    let scoredActions = this.getScoredActions(context);

    let recommendedActions: IRecommendedAction[] = [];
    for (let index = 0; index < this.nRecommendations; index++) {
      const sampleIndex = this._sampleFromActionScores(scoredActions);
      recommendedActions[index] = scoredActions[sampleIndex];
      scoredActions.splice(sampleIndex, 1);
    }
    const recommendation: IMultiRecommendation = {
      context: context,
      recommendedActions: recommendedActions,
    };
    return recommendation;
  }

  private _generateOracleTrainingData(
    recommendation: IMultiRecommendation,
    selectedActionId: string | undefined = undefined
  ): ITrainingData[] {
    let trainingData: ITrainingData[] = [];
    for (
      let index = 0;
      index < recommendation.recommendedActions.length;
      index++
    ) {
      const actionId = recommendation.recommendedActions[index].actionId;
      const recommendedAction = this.actionsMap[actionId];
      if (!recommendedAction) {
        throw new Error(
          `Failed to generate training data for recommended exercise at index ${index}.`
        );
      }
      const context = recommendation.context;
      const actionFeatures = recommendedAction.features;
      const click = recommendedAction.actionId === selectedActionId ? 1 : 0;
      const probability = recommendation.recommendedActions[index].probability;
      trainingData.push({
        actionId: actionId,
        actionFeatures: actionFeatures,
        context: context,
        click: click,
        probability: probability,
      });
    }
    return trainingData;
  }

  choose(
    recommendation: IMultiRecommendation,
    actionId: string | undefined
  ): Promise<ITrainingData[]> {
    return new Promise((resolve, reject) => {
      try {
        const trainingData = this._generateOracleTrainingData(
          recommendation,
          actionId
        );
        this.train(trainingData);
        resolve(trainingData);
      } catch (error) {
        reject(error);
      }
    });
  }

  rejectAll(recommendation: IMultiRecommendation): Promise<ITrainingData[]> {
    return this.choose(recommendation, undefined);
  }

  feedback(
    recommendation: IMultiRecommendation,
    actionId: string,
    label: string,
    value: number
  ): Promise<ITrainingData[]> {
    return new Promise((resolve, reject) => {
      try {
        if (
          !recommendation.recommendedActions
            .map((action) => action.actionId)
            .includes(actionId)
        ) {
          const recomendationActions = recommendation.recommendedActions.map(
            (action) => action.actionId
          );
          throw new Error(`actionId ${actionId} not in recommendation ${recomendationActions}`);
        }
        if (!this.targetLabels.includes(label)) {
          throw new Error(`label ${label} not in any of weightedOracles`);
        }
        const recommendedAction = this.actionsMap[actionId];
        const probability = recommendation.recommendedActions.find(
          (action) => action.actionId === actionId
        )?.probability;
        const trainingData: ITrainingData[] = [
          {
            actionId: actionId,
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
