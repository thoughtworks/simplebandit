import { IAction, IScoredAction } from "./interfaces/IAction";
import {
  IRecommendation,
  IMultiRecommendation,
} from "./interfaces/IRecommendation";
import { ITrainingData } from "./interfaces/ITrainingData";
import { FeaturesHash } from "./interfaces/IBandits";
import {
  ConvertScoresToProbabilityDistribution,
  SampleFromProbabilityDistribution,
} from "./MathService";
import { SimpleOracle, WeightedOracle } from "./SimpleOracle";
import { IBanditState } from "./interfaces/IState";

export abstract class BaseBandit {
  temperature: number;
  actionsMap: Record<string, IAction>;

  constructor(actions: IAction[], temperature: number) {
    this.actionsMap = actions.reduce((acc, obj) => {
      (acc as any)[obj.actionId] = obj;
      return acc;
    }, {});
    this.temperature = temperature;
  }

  toState(): IBanditState {
    throw new Error("Not implemented");
  }

  static fromState(state: IBanditState, actions: IAction[]): BaseBandit {
    throw new Error("Not implemented");
  }

  toJSON(): string {
    return JSON.stringify(this.toState());
  }

  static fromJSON(json: string, actions: IAction[]): BaseBandit {
    throw new Error("Not implemented");
  }

  _getActionScore(
    actionId: string,
    context: FeaturesHash,
    features: FeaturesHash
  ): number {
    throw new Error("Not implemented");
  }

  _sampleFromActionScores(actionScores: IScoredAction[]): number {
    const scores = actionScores.map((ex) => ex.score);
    const probabilities = ConvertScoresToProbabilityDistribution(
      scores,
      this.temperature
    );
    const sampleIndex = SampleFromProbabilityDistribution(probabilities);
    return sampleIndex;
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

  recommend(context: FeaturesHash): IRecommendation | IMultiRecommendation {
    throw new Error("Not implemented");
  }

  _generateClickOracleTrainingData(
    recommendation: IRecommendation | IMultiRecommendation,
    selectedActionId: string | undefined = undefined
  ): ITrainingData[] {
    if ("actionId" in recommendation) {
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
    } else {
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
        const probability =
          recommendation.recommendedActions[index].probability;
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
  }

  train(trainingData: ITrainingData[]): Promise<void> {
    return new Promise((resolve, reject) => {
      throw new Error("Not implemented");
    });
  }
}

export class SingleOracleBandit extends BaseBandit {
  oracle: SimpleOracle;

  constructor(
    oracle: SimpleOracle,
    actions: IAction[],
    temperature: number = 0.5,
  ) {
    super(actions, temperature);
    this.oracle = oracle;
  }

  _getActionScore(
    actionId: string,
    context: FeaturesHash,
    features: FeaturesHash
  ): number {
    const actionScore = this.oracle.predict(actionId, context, features);
    return actionScore;
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

export class BaseWeightedBandit extends BaseBandit {
  weightedOracles: WeightedOracle[];
  targetLabels: string[];

  constructor(
    weightedOracles: WeightedOracle[],
    actions: IAction[],
    temperature: number = 0.5
  ) {
    super(actions, temperature);
    this.weightedOracles = weightedOracles;
    const oracleWeights = Object.values(weightedOracles).map(
      (oracle) => oracle.weight
    );
    if (oracleWeights.some((weight) => weight < 0)) {
      throw new Error("All weights in oracles must be positive numbers.");
    }
    this.targetLabels = Object.values(weightedOracles).map(
      (oracle) => oracle.oracle.targetLabel
    );
  }

  _getActionScore(
    actionId: string,
    context: FeaturesHash,
    features: FeaturesHash
  ): number {
    let actionScore = 0;
    for (const weightedOracle of this.weightedOracles) {
      actionScore +=
        weightedOracle.weight *
        weightedOracle.oracle.predict(actionId, context, features);
    }
    return actionScore;
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

  feedback(
    recommendation: IRecommendation | IMultiRecommendation,
    label: string,
    value: number,
    actionId: string | undefined = undefined
  ): Promise<ITrainingData[]> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.targetLabels.includes(label)) {
          throw new Error(`label ${label} not in any of weightedOracles`);
        }
        if ("actionId" in recommendation) {
          if (actionId && actionId !== recommendation.actionId) {
            throw new Error(
              `actionId ${actionId} does not match recommendation.actionId ${recommendation.actionId}`
            );
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
        } else {
          if (!actionId) {
            throw new Error(
              `actionId must be provided for multi-recommendation`
            );
          }
          if (
            !recommendation.recommendedActions
              .map((action) => action.actionId)
              .includes(actionId)
          ) {
            const recomendationActions = recommendation.recommendedActions.map(
              (action) => action.actionId
            );
            throw new Error(
              `actionId ${actionId} not in recommendation ${recomendationActions}`
            );
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
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  recommend(
    context: FeaturesHash = {}
  ): IRecommendation | IMultiRecommendation {
    throw new Error("Not implemented");
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
