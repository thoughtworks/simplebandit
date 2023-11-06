import {
  IRecommendation,
  IMultiRecommendation,
} from "./interfaces/IRecommendation";
import { ITrainingData } from "./interfaces/ITrainingData";
import { IRecommendedAction } from "./interfaces/IRecommendation";
import { FeaturesHash } from "./interfaces/IBandits";
import { BaseBandit } from "./BaseBandits";

export function SimpleBanditMixin<T extends new (...args: any[]) => BaseBandit>(
  Base: T
) {
  return class extends Base {
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

    accept(recommendation: IRecommendation): Promise<ITrainingData[]> {
      return new Promise((resolve, reject) => {
        try {
          const trainingData = this._generateClickOracleTrainingData(
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
          const trainingData = this._generateClickOracleTrainingData(
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
  };
}

export function MultiBanditMixin<T extends new (...args: any[]) => BaseBandit>(
  Base: T
) {
  return class extends Base {
    nRecommendations: number;

    constructor(...args: any[]) {
      super(...args);
      this.nRecommendations = args[args.length - 1] || 1;
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

    choose(
      recommendation: IMultiRecommendation,
      actionId: string | undefined
    ): Promise<ITrainingData[]> {
      return new Promise((resolve, reject) => {
        try {
          const trainingData = this._generateClickOracleTrainingData(
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
  };
}
