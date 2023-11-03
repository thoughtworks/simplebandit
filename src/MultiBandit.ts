import { IAction } from "./interfaces/IAction";
import {
  IMultiRecommendation,
  IRecommendedAction,
} from "./interfaces/IRecommendation";
import { IMultiBanditState, IMultiBandit } from "./interfaces/IMultiBandit";
import {
  ConvertScoresToProbabilityDistribution,
  SampleFromProbabilityDistribution,
} from "./MathService";
import { ITrainingData } from "./interfaces/ITrainingData";
import { FeaturesHash } from "./interfaces/ISimpleOracle";
import { SimpleOracle } from "./SimpleOracle";

export class MultiBandit implements IMultiBandit {
  oracle: SimpleOracle;
  actionsMap: Record<string, IAction>;
  temperature: number;
  nRecommendations: number;

  constructor(
    oracle: SimpleOracle,
    actions: IAction[],
    temperature: number = 5.0,
    nRecommendations: number = 3,
  ) {
    this.oracle = oracle;
    this.actionsMap = actions.reduce((acc, obj) => {
      (acc as any)[obj.actionId] = obj;
      return acc;
    }, {});
    this.temperature = temperature;
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
  }): IMultiBandit {
    const actionFeatures = [
      ...new Set(actions.flatMap((action) => Object.keys(action.features))),
    ];
    const actionIds = actions.map((action) => action.actionId);
    const oracle = new SimpleOracle({
      actionIds: actionIds,
      context: context,
      actionFeatures: actionFeatures,
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
  }): IMultiBandit {
    const actions = actionIds.map((actionId) => ({
      actionId: actionId,
      features: {},
    }));
    return MultiBandit.fromContextAndActions({
      context: context,
      actions: actions,
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
  }): IMultiBandit {
    const actionFeatures = [
      ...new Set(actions.flatMap((action) => Object.keys(action.features))),
    ];
    const actionIds = actions.map((action) => action.actionId);
    const oracle = new SimpleOracle({
      actionIds: actionIds,
      actionFeatures: actionFeatures,
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
  }): IMultiBandit {
    const actions = actionIds.map((actionId) => ({
      actionId: actionId,
      features: {},
    }));
    return MultiBandit.fromActions({
      actions: actions,
      temperature: temperature,
      learningRate: learningRate,
      nRecommendations: nRecommendations,
    });
  }

  static fromJSON(json: string, actions: IAction[]): IMultiBandit {
    const state = JSON.parse(json) as IMultiBanditState;
    return MultiBandit.fromMultiBanditState(state, actions);
  }

  static fromMultiBanditState(
    state: IMultiBanditState,
    actions: IAction[],
  ): IMultiBandit {
    const oracle = SimpleOracle.fromOracleState(state.oracleState);

    const temperature = state.temperature;
    const nRecommendations = state.nRecommendations;
    return new MultiBandit(oracle, actions, temperature, nRecommendations);
  }

  getMultiBanditState(): IMultiBanditState {
    return {
      oracleState: this.oracle.getOracleState(),
      temperature: this.temperature,
      nRecommendations: this.nRecommendations,
    };
  }

  toJSON(): string {
    return JSON.stringify(this.getMultiBanditState());
  }

  private _sampleFromActionScores(actionScores: IRecommendedAction[]): number {
    const scores = actionScores.map((ex) => ex.score);
    const probabilities = ConvertScoresToProbabilityDistribution(
      scores,
      this.temperature,
    );
    const sampleIndex = SampleFromProbabilityDistribution(probabilities);
    return sampleIndex;
  }

  getScoredActions(context: FeaturesHash = {}): IRecommendedAction[] {
    let scoredActions: IRecommendedAction[] = [];

    const actionIds = Object.keys(this.actionsMap);
    for (let i = 0; i < actionIds.length; i++) {
      const actionId = actionIds[i];
      const action = this.actionsMap[actionId];
      const actionScore = this.oracle.predict(
        action.actionId,
        context,
        action.features,
      );
      const softmaxNumerator = Math.exp(this.temperature * actionScore);
      scoredActions.push({
        actionId: actionId,
        score: actionScore,
        probability: softmaxNumerator,
      });
    }
    let SoftmaxDenominator = scoredActions.reduce(
      (a, b) => a + b.probability,
      0,
    );
    scoredActions = scoredActions.map((ex) => ({
      actionId: ex.actionId,
      score: ex.score,
      probability: ex.probability / SoftmaxDenominator,
    }));
    return scoredActions;
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
    selectedActionId: string | undefined = undefined,
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
          `Failed to generate training data for recommended exercise at index ${index}.`,
        );
      }
      const context = recommendation.context;
      const actionFeatures = recommendedAction.features;
      const label = recommendedAction.actionId === selectedActionId ? 1 : 0;
      const probability = recommendation.recommendedActions[index].probability;
      trainingData.push({
        actionId: actionId,
        actionFeatures: actionFeatures,
        context: context,
        label: label,
        probability: probability,
      });
    }
    return trainingData;
  }

  choose(
    recommendation: IMultiRecommendation,
    actionId: string | undefined,
  ): Promise<ITrainingData[]> {
    return new Promise((resolve, reject) => {
      try {
        const trainingData = this._generateOracleTrainingData(
          recommendation,
          actionId,
        );
        this.oracle.fitMany(trainingData);
        resolve(trainingData);
      } catch (error) {
        reject(error);
      }
    });
  }

  rejectAll(recommendation: IMultiRecommendation): Promise<ITrainingData[]> {
    return this.choose(recommendation, undefined);
  }

  train(trainingData: ITrainingData[]): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.oracle.fitMany(trainingData);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
}
