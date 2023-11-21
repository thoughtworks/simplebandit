import { IAction, IScoredAction, IActionsInput } from "./interfaces/IAction";
import {
  IRecommendation,
  ISlate,
  ISlateAction,
} from "./interfaces/IRecommendation";
import { ITrainingData } from "./interfaces/ITrainingData";
import { ISimpleBandit } from "./interfaces/ISimpleBandit";
import { ISimpleBanditState } from "./interfaces/IState";

import { SampleFromProbabilityDistribution } from "./Sampling";
import { SimpleOracle } from "./SimpleOracle";

export class SimpleBandit implements ISimpleBandit {
  oracle: SimpleOracle[];
  targetLabels: string[];
  temperature: number;
  actionsMap: Record<string, IAction>;
  slateSize: number;

  constructor({
    oracle: oracle,
    actions,
    temperature = 0.5,
    slateSize = 1,
  }: {
    oracle?: SimpleOracle | SimpleOracle[];
    actions: IActionsInput;
    temperature?: number;
    slateSize?: number;
  }) {
    this.oracle = Array.isArray(oracle)
      ? oracle
      : oracle
      ? [oracle]
      : [new SimpleOracle()];
    this.targetLabels = [
      ...new Set(this.oracle.map((oracle) => oracle.targetLabel)),
    ];
    this.actionsMap = this._processActions(actions);
    this.temperature = temperature;
    this.slateSize = slateSize;
  }

  _processActions(input: IActionsInput): Record<string, IAction> {
    const actionsMap: Record<string, IAction> = {};

    if (Array.isArray(input)) {
      input.forEach((item) => {
        if (typeof item === "string") {
          actionsMap[item] = { actionId: item, features: {} };
        } else {
          actionsMap[item.actionId] = item;
        }
      });
    } else {
      Object.keys(input).forEach((key) => {
        const value = input[key];
        if (Array.isArray(value)) {
          actionsMap[key] = {
            actionId: key,
            features: value.reduce(
              (acc, curr) => {
                acc[curr] = 1;
                return acc;
              },
              {} as { [feature: string]: number },
            ),
          };
        } else {
          actionsMap[key] = { actionId: key, features: value };
        }
      });
    }
    return actionsMap;
  }

  toState(): ISimpleBanditState {
    return {
      oracleStates: this.oracle.map((oracle) => oracle.getOracleState()),
      temperature: this.temperature,
      slateSize: this.slateSize,
    };
  }

  static fromState(
    state: ISimpleBanditState,
    actions: IAction[],
  ): SimpleBandit {
    const oracles = state.oracleStates.map((oracleState) =>
      SimpleOracle.fromOracleState(oracleState),
    );
    return new SimpleBandit({
      oracle: oracles,
      actions: actions,
      temperature: state.temperature,
      slateSize: state.slateSize,
    });
  }

  toJSON(): string {
    return JSON.stringify(this.toState());
  }

  static fromJSON(json: string, actions: IAction[]): SimpleBandit {
    const state = JSON.parse(json) as ISimpleBanditState;
    return SimpleBandit.fromState(state, actions);
  }

  _getActionScore(
    actionId: string,
    context: { [feature: string]: number },
    features: { [feature: string]: number },
  ): number {
    return this.oracle.reduce(
      (score, oracle) =>
        score +
        oracle.oracleWeight * oracle.predict(actionId, context, features),
      0,
    );
  }

  getScoredActions(
    context: { [feature: string]: number } = {},
    options: { include?: string[]; exclude?: string[] } = {},
  ): IScoredAction[] {
    let scoredActions: IScoredAction[] = [];

    let actionIds = Object.keys(this.actionsMap);
    if (options?.include)
      actionIds = actionIds.filter(
        (action) => options?.include?.includes(action),
      );
    if (options?.exclude)
      actionIds = actionIds.filter(
        (action) => !options?.exclude?.includes(action),
      );
    for (let i = 0; i < actionIds.length; i++) {
      const actionId = actionIds[i];
      const action = this.actionsMap[actionId];
      const actionScore = this._getActionScore(
        action.actionId,
        context,
        action.features,
      );
      const softmaxNumerator = Math.exp(actionScore / this.temperature);
      scoredActions.push({
        actionId: actionId,
        score: actionScore,
        probability: softmaxNumerator,
      });
    }
    if (this.temperature > 0) {
      const SoftmaxDenominator = scoredActions.reduce(
        (a, b) => a + b.probability,
        0,
      );
      scoredActions = scoredActions.map((ex) => ({
        actionId: ex.actionId,
        score: ex.score,
        probability: ex.probability / SoftmaxDenominator,
      }));
    } else {
      const maxScore = Math.max(...scoredActions.map((action) => action.score));
      scoredActions = scoredActions.map((ex) => ({
        actionId: ex.actionId,
        score: ex.score,
        probability: ex.score === maxScore ? 1 : 0,
      }));
    }

    return scoredActions;
  }

  getScoredActionsPerOracle(
    context: { [feature: string]: number } = {},
    options: { include?: string[]; exclude?: string[] } = {},
  ): Array<{ [key: string]: number | string }> {
    const scoredActions: IScoredAction[] = this.getScoredActions(
      context,
      options,
    );
    const scoredActionsPerOracle: Array<{ [key: string]: number | string }> =
      [];
    for (let scoredAction of scoredActions) {
      const scoredActionPerOracle: { [key: string]: number | string } = {
        actionId: scoredAction.actionId,
        weightedScore: scoredAction.score,
        probability: scoredAction.probability,
      };
      for (let oracle of this.oracle) {
        const oracleScore = oracle.predict(
          scoredAction.actionId,
          context,
          this.actionsMap[scoredAction.actionId].features,
        );
        scoredActionPerOracle[oracle.name] = oracleScore;
      }
      scoredActionsPerOracle.push(scoredActionPerOracle);
    }
    return scoredActionsPerOracle;
  }

  _generateClickOracleTrainingData(
    recommendation: IRecommendation | ISlate,
    selectedActionId: string | undefined = undefined,
  ): ITrainingData[] {
    if ("actionId" in recommendation) {
      const trainingData: ITrainingData[] = [
        {
          recommendationId: recommendation.recommendationId,
          actionId: recommendation.actionId,
          features: this.actionsMap[recommendation.actionId].features,
          context: recommendation.context,
          click: recommendation.actionId === selectedActionId ? 1 : 0,
          probability: recommendation.probability,
        },
      ];
      return trainingData;
    } else {
      const trainingData: ITrainingData[] = [];
      for (let index = 0; index < recommendation.slateItems.length; index++) {
        const actionId = recommendation.slateItems[index].actionId;
        const recommendedAction = this.actionsMap[actionId];
        if (!recommendedAction) {
          throw new Error(
            `Failed to generate training data for recommended exercise at index ${index}.`,
          );
        }
        const context = recommendation.context;
        const features = recommendedAction.features;
        const click = recommendedAction.actionId === selectedActionId ? 1 : 0;
        const probability = recommendation.slateItems[index].probability;
        trainingData.push({
          recommendationId: recommendation.recommendationId,
          actionId: actionId,
          features: features,
          context: context,
          click: click,
          probability: probability,
        });
      }
      return trainingData;
    }
  }

  _generateRecommendationId(): string {
    // without uuid dependency
    return (
      "id-" +
      Math.random().toString(36).substr(2, 16) +
      "-" +
      Date.now().toString(36)
    );
  }

  recommend(
    context: { [feature: string]: number } = {},
    options: { include?: string[]; exclude?: string[] } = {},
  ): IRecommendation {
    let scoredActions = this.getScoredActions(context, options);
    let sampleIndex;
    if (this.temperature === 0) {
      sampleIndex = scoredActions.findIndex(
        (action) =>
          action.score ===
          Math.max(...scoredActions.map((action) => action.score)),
      );
    } else {
      const probabilities = scoredActions.map((action) => action.probability);
      sampleIndex = SampleFromProbabilityDistribution(probabilities);
    }
    const recommendedAction = scoredActions[sampleIndex];

    const recommendation: IRecommendation = {
      recommendationId: this._generateRecommendationId(),
      context: context,
      actionId: recommendedAction.actionId,
      score: recommendedAction.score,
      probability: recommendedAction.probability,
    };
    return recommendation;
  }

  slate(
    context: { [feature: string]: number } = {},
    options: {
      include?: string[];
      exclude?: string[];
      slateSize?: number;
    } = {},
  ): ISlate {
    let scoredActions = this.getScoredActions(context, options);
    const slateItems: ISlateAction[] = [];
    const slateSize = Math.min(
      options.slateSize ?? this.slateSize,
      Object.keys(this.actionsMap).length,
    );
    let sampleIndex;
    for (let index = 0; index < slateSize; index++) {
      if (this.temperature === 0) {
        sampleIndex = scoredActions.findIndex(
          (action) =>
            action.score ===
            Math.max(...scoredActions.map((action) => action.score)),
        );
      } else {
        const probabilities = scoredActions.map((action) => action.probability);
        sampleIndex = SampleFromProbabilityDistribution(probabilities);
      }
      slateItems[index] = scoredActions[sampleIndex];
      scoredActions.splice(sampleIndex, 1);
    }
    const slate: ISlate = {
      recommendationId: this._generateRecommendationId(),
      context: context,
      slateItems: slateItems,
    };
    return slate;
  }

  accept(recommendation: IRecommendation): Promise<ITrainingData[]> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.targetLabels.includes("click")) {
          throw new Error(
            "no oracle with `click` as targetLabel, so cannot use accept()",
          );
        }
        const trainingData = this._generateClickOracleTrainingData(
          recommendation,
          recommendation.actionId,
        );
        this.train(trainingData);
        resolve(trainingData);
      } catch (error) {
        reject(error);
      }
    });
  }

  choose(slate: ISlate, actionId: string): Promise<ITrainingData[]> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.targetLabels.includes("click")) {
          throw new Error(
            "no oracle with `click` as targetLabel, so cannot use accept()",
          );
        }
        if (actionId == undefined) {
          throw new Error(`need to provide actionId`);
        }
        const actionIds = slate.slateItems.map((action) => action.actionId);
        if (!actionIds.includes(actionId)) {
          throw new Error(`ActionId ${actionId} is not in slateItems`);
        }
        const trainingData = this._generateClickOracleTrainingData(
          slate,
          actionId,
        );
        this.train(trainingData);
        resolve(trainingData);
      } catch (error) {
        reject(error);
      }
    });
  }

  reject(recommendation: IRecommendation | ISlate): Promise<ITrainingData[]> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.targetLabels.includes("click")) {
          throw new Error(
            "no oracle with `click` as targetLabel, so cannot use accept()",
          );
        }
        const trainingData = this._generateClickOracleTrainingData(
          recommendation,
          undefined,
        );
        this.train(trainingData);
        resolve(trainingData);
      } catch (error) {
        reject(error);
      }
    });
  }

  feedback(
    recommendation_or_slate: IRecommendation | ISlate,
    label: string,
    value: number,
    actionId: string | undefined = undefined,
  ): Promise<ITrainingData[]> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.targetLabels.includes(label)) {
          throw new Error(`label ${label} not in any of weightedOracles`);
        }

        let recommendedAction: IAction;
        let probability: number;
        if ("actionId" in recommendation_or_slate) {
          // IRecommendation
          if (actionId && actionId !== recommendation_or_slate.actionId) {
            throw new Error(
              `actionId ${actionId} does not match recommendation.actionId ${recommendation_or_slate.actionId}`,
            );
          }
          recommendedAction = this.actionsMap[recommendation_or_slate.actionId];
          probability = recommendation_or_slate.probability;
        } else {
          // ISlate
          if (actionId === undefined) {
            throw new Error(`actionId must be provided for slate`);
          }
          const foundAction = recommendation_or_slate.slateItems.find(
            (action) => action.actionId === actionId,
          );
          if (!foundAction) {
            throw new Error(
              `No action found in slate with actionId ${actionId}`,
            );
          }
          if (!this.actionsMap.hasOwnProperty(actionId)) {
            throw new Error(
              `No action found for this bandit with actionId ${actionId}`,
            );
          }
          recommendedAction = this.actionsMap[actionId];
          probability = foundAction.probability;
        }
        const trainingData: ITrainingData[] = [
          {
            recommendationId: recommendation_or_slate.recommendationId,
            actionId: recommendedAction.actionId,
            features: recommendedAction.features,
            context: recommendation_or_slate.context,
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
        for (const oracle of this.oracle) {
          oracle.fit(trainingData);
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
}
