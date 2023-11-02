
import { IAction, IScoredAction } from "./interfaces/IAction"; 
import {
  IRecommendation,
  IRecommendedAction,
} from "./interfaces/IRecommendation";
import {
  ISimpleBanditState, ISimpleBandit,
} from "./interfaces/ISimpleBandit";
import {
  ConvertScoresToProbabilityDistribution,
  SampleFromProbabilityDistribution,
} from "./MathService";
import { ITrainingData } from "./interfaces/ITrainingData";
import { FeaturesHash } from "./interfaces/ISimpleOracle";
import { SimpleOracle } from "./SimpleOracle";


export class SimpleBandit implements ISimpleBandit {
  oracle: SimpleOracle;
  actionsMap: Record<string, IAction>;
  softmaxBeta: number;

  constructor(
    oracle: SimpleOracle,
    actions: IAction[],
    softmaxBeta: number = 1.0,
  ) {
    this.oracle = oracle;
    this.actionsMap = actions.reduce((acc, obj) => {
      (acc as any)[obj.actionId] = obj;
      return acc;
    }, {});
    this.softmaxBeta = softmaxBeta;
  }

  static fromContextAndActions(
    context: string[],
    actions: IAction[],
    softmaxBeta: number = 5.0,
    learningRate: number = 1.0,
  ): ISimpleBandit {
    const actionFeatures = [...new Set(actions.flatMap((action) => Object.keys(action.features)))];
    const actionIds = actions.map((action) => action.actionId);
    const banditOracle = new SimpleOracle({
      actionIds:actionIds, context:context, actionFeatures:actionFeatures, learningRate:learningRate});
    return new SimpleBandit(
      banditOracle,
      actions,
      softmaxBeta,
    );
  }

  static fromContextAndActionIds(
    context: string[],
    actionIds: string[],
    softmaxBeta: number = 5.0,
    learningRate: number = 1.0,
  ): ISimpleBandit {
    const actions = actionIds.map((actionId) => ({
      actionId: actionId,
      features: {},
    }));
    return SimpleBandit.fromContextAndActions(context, actions, softmaxBeta, learningRate);
  }

  static fromActions(
    actions: IAction[],
    softmaxBeta: number = 5.0,
    learningRate: number = 1.0,
  ): ISimpleBandit {
    const actionFeatures = [...new Set(actions.flatMap((action) => Object.keys(action.features)))];
    const actionIds = actions.map((action) => action.actionId);
    const banditOracle = new SimpleOracle({actionIds:actionIds, context:[], actionFeatures:actionFeatures, learningRate:learningRate});
    return new SimpleBandit(
      banditOracle,
      actions,
      softmaxBeta,
    );
  }

  static fromActionIds(
    actionIds: string[],
    softmaxBeta: number = 5.0,
    learningRate: number = 1.0,
  ): ISimpleBandit {
    const actions = actionIds.map((actionId) => ({
      actionId: actionId,
      features: {},
    }));
    return SimpleBandit.fromActions(actions, softmaxBeta, learningRate);
  }

  static fromJSON(
    json: string,
    actions: IAction[]
  ): ISimpleBandit {
    const state = JSON.parse(json) as ISimpleBanditState; 
    return SimpleBandit.fromSimpleBanditState(state, actions);
  }

  static fromSimpleBanditState(
    state: ISimpleBanditState,
    actions: IAction[]
  ): ISimpleBandit {
    const banditOracle = SimpleOracle.fromOracleState(state.oracleState);

    const softmaxBeta = state.softmaxBeta;
    return new SimpleBandit(
      banditOracle,
      actions,
      softmaxBeta,
    );
  }

  getSimpleBanditState(): ISimpleBanditState {
    return {
      oracleState: this.oracle.getOracleState(),
      softmaxBeta: this.softmaxBeta,
    };
  }

  toJSON(): string {
    return JSON.stringify(this.getSimpleBanditState());
  }

  _sampleFromActionScores(actionScores: IRecommendedAction[]): number {
    const scores = actionScores.map((ex) => ex.score);
    const probabilities = ConvertScoresToProbabilityDistribution(
      scores,
      this.softmaxBeta
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
      const actionScore = this.oracle.predict(
        action.actionId,
        context,
        action.features,
      );
      const softmaxNumerator = Math.exp(this.softmaxBeta * actionScore);
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


  makeRecommendation(context: FeaturesHash = {}): IRecommendation {
    let scoredActions= this.getScoredActions(context);
    const sampleIndex = this._sampleFromActionScores(scoredActions);
    const recommendedAction = scoredActions[sampleIndex]
    
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
        label: recommendation.actionId === selectedActionId ? 1 : 0,
        probability: recommendation.probability,
      }
    ];
    return trainingData;
  }

  acceptRecommendation(
    recommendation: IRecommendation,
  ): Promise<ITrainingData[]> {
    return new Promise((resolve, reject) => {
      try {
        const trainingData = this._generateOracleTrainingData(
          recommendation,
          recommendation.actionId
        );
        this.oracle.fitMany(trainingData);
        resolve(trainingData);
      } catch (error) {
        reject(error);
      }
    });
  }

  rejectRecommendation(
    recommendation: IRecommendation,
  ): Promise<ITrainingData[]> {
    return new Promise((resolve, reject) => {
      try {
        const trainingData = this._generateOracleTrainingData(
          recommendation,
          undefined
        );
        this.oracle.fitMany(trainingData);
        resolve(trainingData);
      } catch (error) {
        reject(error);
      }
    });
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
