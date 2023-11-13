import { IAction, IScoredAction } from "./interfaces/IAction";
import {
  IRecommendation,
  ISlate,
  ISlateAction,
} from "./interfaces/IRecommendation";
import { ITrainingData } from "./interfaces/ITrainingData";
import { SampleFromProbabilityDistribution } from "./Sampling";
import { SimpleOracle } from "./SimpleOracle";
import { ISimpleBandit } from "./interfaces/ISimpleBandit";
import { ISimpleBanditState } from "./interfaces/IState";

export class SimpleBandit implements ISimpleBandit {
  oracles: SimpleOracle[];
  targetLabels: string[];
  temperature: number;
  actionsMap: Record<string, IAction>;
  slateSize: number;

  constructor({
    oracles,
    actions,
    temperature = 0.5,
    slateSize = 1,
  }: {
    oracles: SimpleOracle | SimpleOracle[];
    actions: IAction[];
    temperature?: number;
    slateSize?: number;
  }) {
    this.oracles = Array.isArray(oracles) ? oracles : [oracles];
    this.targetLabels = this.oracles.map((oracle) => oracle.targetLabel);
    this.actionsMap = actions.reduce((acc, obj) => {
      (acc as any)[obj.actionId] = obj;
      return acc;
    }, {});
    this.temperature = temperature;
    this.slateSize = slateSize;
  }

  static fromActions({
    actions,
    temperature = 5.0,
    learningRate = 1.0,
    slateSize = 1,
  }: {
    actions: IAction[];
    temperature?: number;
    learningRate?: number;
    slateSize?: number;
  }): SimpleBandit {
    const features = [
      ...new Set(actions.flatMap((action) => Object.keys(action.features))),
    ];
    const actionIds = actions.map((action) => action.actionId);
    const oracle = new SimpleOracle({
      actionIds: actionIds,
      context: [],
      features: features,
      learningRate: learningRate,
    });
    return new SimpleBandit({
      oracles: [oracle],
      actions: actions,
      temperature: temperature,
      slateSize: slateSize,
    });
  }

  static fromContextAndActions({
    context,
    actions,
    temperature = 0.5,
    learningRate = 1.0,
    slateSize = 1,
  }: {
    context: string[];
    actions: IAction[];
    temperature?: number;
    learningRate?: number;
    slateSize?: number;
  }): SimpleBandit {
    const features = [
      ...new Set(actions.flatMap((action) => Object.keys(action.features))),
    ];
    const actionIds = actions.map((action) => action.actionId);
    const oracle = new SimpleOracle({
      actionIds: actionIds,
      context: context,
      features: features,
      learningRate: learningRate,
    });
    return new SimpleBandit({
      oracles: [oracle],
      actions: actions,
      temperature: temperature,
      slateSize: slateSize,
    });
  }

  static fromActionIds({
    actionIds,
    temperature = 0.5,
    learningRate = 1.0,
    slateSize = 1,
  }: {
    actionIds: string[];
    temperature?: number;
    learningRate?: number;
    slateSize?: number;
  }): SimpleBandit {
    const actions = actionIds.map((actionId) => ({
      actionId: actionId,
      features: {},
    }));
    return SimpleBandit.fromActions({
      actions,
      temperature,
      learningRate,
      slateSize,
    });
  }

  static fromContextAndActionIds({
    context,
    actionIds,
    temperature = 0.5,
    learningRate = 1.0,
    slateSize = 1,
  }: {
    context: string[];
    actionIds: string[];
    temperature?: number;
    learningRate?: number;
    slateSize?: number;
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
      slateSize,
    });
  }

  toState(): ISimpleBanditState {
    return {
      oracleStates: this.oracles.map((oracle) => oracle.getOracleState()),
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
      oracles: oracles,
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
    return this.oracles.reduce(
      (score, oracle) =>
        score +
        oracle.oracleWeight * oracle.predict(actionId, context, features),
      0,
    );
  }

  getScoredActions(
    context: { [feature: string]: number } = {},
  ): IScoredAction[] {
    let scoredActions: IScoredAction[] = [];

    const actionIds = Object.keys(this.actionsMap);
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

  getScoredActionsPerOracle(
    context: { [feature: string]: number } = {},
  ): Array<{ [key: string]: number | string }> {
    let actionScoresPerOracle: Array<{ [key: string]: number | string }> = [];
    for (const [actionId, action] of Object.entries(this.actionsMap)) {
      for (const oracle of this.oracles) {
        const score = oracle.predict(actionId, context, action.features);
        actionScoresPerOracle.push({
          actionId: actionId,
          [oracle.targetLabel]: score,
          name: oracle.name,
          weight: oracle.oracleWeight,
        });
      }
    }
    return actionScoresPerOracle;
  }

  _generateClickOracleTrainingData(
    recommendation: IRecommendation | ISlate,
    selectedActionId: string | undefined = undefined,
  ): ITrainingData[] {
    if ("actionId" in recommendation) {
      let trainingData: ITrainingData[] = [
        {
          actionId: recommendation.actionId,
          features: this.actionsMap[recommendation.actionId].features,
          context: recommendation.context,
          click: recommendation.actionId === selectedActionId ? 1 : 0,
          probability: recommendation.probability,
        },
      ];
      return trainingData;
    } else {
      let trainingData: ITrainingData[] = [];
      for (let index = 0; index < recommendation.slateActions.length; index++) {
        const actionId = recommendation.slateActions[index].actionId;
        const recommendedAction = this.actionsMap[actionId];
        if (!recommendedAction) {
          throw new Error(
            `Failed to generate training data for recommended exercise at index ${index}.`,
          );
        }
        const context = recommendation.context;
        const features = recommendedAction.features;
        const click = recommendedAction.actionId === selectedActionId ? 1 : 0;
        const probability = recommendation.slateActions[index].probability;
        trainingData.push({
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

  recommend(context: { [feature: string]: number } = {}): IRecommendation {
    let scoredActions = this.getScoredActions(context);
    const probabilities = scoredActions.map((action) => action.probability);
    const sampleIndex = SampleFromProbabilityDistribution(probabilities);
    const recommendedAction = scoredActions[sampleIndex];

    const recommendation: IRecommendation = {
      context: context,
      actionId: recommendedAction.actionId,
      score: recommendedAction.score,
      probability: recommendedAction.probability,
    };
    return recommendation;
  }

  slate(context: { [feature: string]: number } = {}): ISlate {
    let scoredActions = this.getScoredActions(context);

    let slateActions: ISlateAction[] = [];
    for (let index = 0; index < this.slateSize; index++) {
      const probabilities = scoredActions.map((action) => action.probability);
      const sampleIndex = SampleFromProbabilityDistribution(probabilities);
      // const sampleIndex = this._sampleFromActionScores(scoredActions);
      slateActions[index] = scoredActions[sampleIndex];
      scoredActions.splice(sampleIndex, 1);
    }
    const slate: ISlate = {
      context: context,
      slateActions: slateActions,
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
        const actionIds = slate.slateActions.map((action) => action.actionId);
        if (!actionIds.includes(actionId)) {
          throw new Error(`ActionId ${actionId} is not in slateActions`);
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
          const foundAction = recommendation_or_slate.slateActions.find(
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
        for (let oracle of this.oracles) {
          oracle.fit(trainingData);
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
}
