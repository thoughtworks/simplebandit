import { SimpleOracle } from "../SimpleOracle";
import { SimpleBandit } from "../SimpleBandit";
import { ISimpleBanditState } from "../interfaces/IState";
import { IScoredAction } from "../interfaces/IAction";
import { IRecommendation } from "../interfaces/IRecommendation";
import { ITrainingData } from "../interfaces/ITrainingData";

describe("Multiple Oracles Recomendation", () => {
  let bandit: SimpleBandit;
  let oracle: SimpleOracle[];
  const actionIds = ["apple", "pear", "chocolate"];
  const actions = [
    {
      actionId: "apple",
      features: { fruit: 1 },
    },
    {
      actionId: "pear",
      features: { fruit: 1 },
    },
    {
      actionId: "chocolate",
      features: { fruit: 0 },
    },
  ];
  const temperature = 0.5;

  beforeEach(() => {
    oracle = [
      new SimpleOracle({
        actionIds: actionIds,
        context: ["morning"],
        features: ["fruit"],
        targetLabel: "click",
        learningRate: 1.0,
        oracleWeight: 0.5,
      }),
      new SimpleOracle({
        actionIds: actionIds,
        context: ["morning"],
        features: ["fruit"],
        targetLabel: "rating",
        learningRate: 1.0,
        oracleWeight: 0.5,
      }),
    ];

    bandit = new SimpleBandit({
      oracle: oracle,
      actions: actions,
      temperature: temperature,
    });
  });

  describe("constructor", () => {
    it("should create an instance of SimpleBandit with the correct properties", () => {
      expect(bandit.oracle).toEqual(oracle);
      expect(bandit.temperature).toEqual(temperature);
    });
  });

  describe("getBanditState", () => {
    it("should return the correct state", () => {
      const state: ISimpleBanditState = {
        oracleStates: [oracle[0].getOracleState(), oracle[1].getOracleState()],
        temperature: 0.5,
        slateSize: 1,
      };
      expect(bandit.toState()).toEqual(state);
    });
  });

  describe("toJSON", () => {
    it("should return the correct JSON string", () => {
      const state: ISimpleBanditState = {
        oracleStates: [oracle[0].getOracleState(), oracle[1].getOracleState()],
        temperature: 0.5,
        slateSize: 1,
      };
      expect(bandit.toJSON()).toEqual(JSON.stringify(state));
    });
  });

  describe("fromJSON", () => {
    it("should return the correct instance", () => {
      const state: ISimpleBanditState = {
        oracleStates: [oracle[0].getOracleState(), oracle[1].getOracleState()],
        temperature: 0.5,
        slateSize: 1,
      };
      const bandit2 = SimpleBandit.fromJSON(JSON.stringify(state), actions);
      expect(bandit2).toEqual(bandit);
    });
  });

  describe("all actionsIds should be keys of actionsMap", () => {
    it("should have all actionIds as keys in actionsMap", () => {
      actionIds.forEach((id) => {
        expect(bandit.actionsMap).toHaveProperty(id);
      });
    });
  });

  describe("getScoredActions", () => {
    const context: { [feature: string]: number } = { morning: 1 };
    let scoredActions: IScoredAction[] = [];
    beforeEach(() => {
      scoredActions = bandit.getScoredActions(context);
    });

    it("should return an array of scored actions", () => {
      expect(scoredActions).toBeInstanceOf(Array);
      scoredActions.forEach((scoredAction) => {
        expect(scoredAction).toHaveProperty("actionId");
        expect(scoredAction).toHaveProperty("score");
      });
    });
  });

  describe("getScoredActionsPerOracle", () => {
    const context: { [feature: string]: number } = { morning: 1 };
    let scoredActions: Array<{ [key: string]: number | string }> = [];
    beforeEach(() => {
      scoredActions = bandit.getScoredActionsPerOracle(context);
    });

    it("should return an array of scored actions per Oracle", () => {
      expect(scoredActions).toBeInstanceOf(Array);
      scoredActions.forEach((scoredAction) => {
        expect(scoredAction).toHaveProperty("actionId");
        expect(scoredAction).toHaveProperty("click");
        expect(scoredAction).toHaveProperty("rating");
        expect(scoredAction).toHaveProperty("weightedScore");
        expect(scoredAction).toHaveProperty("probability");
      });
    });
  });

  describe("train", () => {
    it("training the bandit should change the weights of the oracle", async () => {
      const oldWeights: Array<{ [feature: string]: number }> =
        bandit.oracle.map((oracle) => {
          return { ...oracle.weights };
        });
      const trainingData: ITrainingData[] = [
        {
          recommendationId: "recommendation1",
          actionId: "apple",
          probability: 0.5,
          context: { morning: 1 },
          features: { fruit: 1 },
          click: 1,
        },
        {
          recommendationId: "recommendation2",
          actionId: "pear",
          probability: 0.5,
          context: { morning: 1 },
          features: { fruit: 1 },
          click: 1,
        },
        {
          recommendationId: "recommendation3",
          actionId: "chocolate",
          probability: 0.5,
          context: { morning: 1 },
          features: { fruit: 0 },
          click: 0,
        },
        {
          recommendationId: "recommendation1",
          actionId: "chocolate",
          probability: 0.5,
          context: { morning: 1 },
          features: { fruit: 0 },
          rating: 1,
        },
        {
          recommendationId: "recommendation3",
          actionId: "apple",
          probability: 0.5,
          context: { morning: 0 },
          features: { fruit: 1 },
          rating: 0,
        },
      ];
      await bandit.train(trainingData);
      for (let i = 0; i < bandit.oracle.length; i++) {
        expect(bandit.oracle[i].weights).not.toEqual(oldWeights[i]);
      }
    });
  });

  describe("recommend", () => {
    const context: { [feature: string]: number } = { morning: 1 };
    let recommendation: IRecommendation;
    beforeEach(() => {
      recommendation = bandit.recommend(context);
    });

    it("recommendation context should equal input context", () => {
      expect(recommendation.context).toEqual(context);
    });
    it("recommendation should have both an actionId a score and a probability that is defined", () => {
      expect(recommendation.actionId).toBeDefined();
      expect(recommendation.score).toBeDefined();
      expect(recommendation.probability).toBeDefined();
    });
    describe("accept", () => {
      it("the weights of the oracle should be changed", async () => {
        const oldWeights = { ...bandit.oracle[0].weights };
        await bandit.accept(recommendation);
        expect(bandit.oracle[0].weights).not.toEqual(oldWeights);
      });
    });
    describe("reject", () => {
      it("the weights of the oracle should be changed", async () => {
        await bandit.accept(recommendation);
        const oldWeights = { ...bandit.oracle[0].weights };
        await bandit.reject(recommendation);
        expect(bandit.oracle[0].weights).not.toEqual(oldWeights);
      });
    });
    describe("feedback", () => {
      it("the weights of the oracle should be changed", async () => {
        const oldWeights = { ...bandit.oracle[1].weights };
        await bandit.feedback(recommendation, "rating", 1);
        expect(bandit.oracle[1].weights).not.toEqual(oldWeights);
      });
    });
  });
});
