import { SimpleOracle } from "../SimpleOracle";
import { SimpleBandit } from "../SimpleBandit";
import { ISimpleBanditState } from "../interfaces/IState";
import { IScoredAction } from "../interfaces/IAction";
import { IRecommendation } from "../interfaces/IRecommendation";
import { ITrainingData } from "../interfaces/ITrainingData";

describe("Multiple Oracles Recomendation", () => {
  let bandit: SimpleBandit;
  let oracles: SimpleOracle[];
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
    oracles = [
      new SimpleOracle({
        actionIds: actionIds,
        context: ["morning"],
        actionFeatures: ["fruit"],
        targetLabel: "click",
        learningRate: 1.0,
        oracleWeight: 0.5,
      }),
      new SimpleOracle({
        actionIds: actionIds,
        context: ["morning"],
        actionFeatures: ["fruit"],
        targetLabel: "rating",
        learningRate: 1.0,
        oracleWeight: 0.5,
      }),
    ];

    bandit = new SimpleBandit({
      oracles: oracles,
      actions: actions,
      temperature: temperature,
    });
  });

  describe("constructor", () => {
    it("should create an instance of SimpleBandit with the correct properties", () => {
      expect(bandit.oracles).toEqual(oracles);
      expect(bandit.temperature).toEqual(temperature);
    });
  });

  describe("getBanditState", () => {
    it("should return the correct state", () => {
      const state: ISimpleBanditState = {
        oracleStates: [
          oracles[0].getOracleState(),
          oracles[1].getOracleState(),
        ],
        temperature: 0.5,
        slateSize: 1,
      };
      expect(bandit.toState()).toEqual(state);
    });
  });

  describe("toJSON", () => {
    it("should return the correct JSON string", () => {
      const state: ISimpleBanditState = {
        oracleStates: [
          oracles[0].getOracleState(),
          oracles[1].getOracleState(),
        ],
        temperature: 0.5,
        slateSize: 1,
      };
      expect(bandit.toJSON()).toEqual(JSON.stringify(state));
    });
  });

  describe("fromJSON", () => {
    it("should return the correct instance", () => {
      const state: ISimpleBanditState = {
        oracleStates: [
          oracles[0].getOracleState(),
          oracles[1].getOracleState(),
        ],
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
        expect(scoredAction).toHaveProperty("name");
        expect(scoredAction).toHaveProperty("weight");
      });
      expect(scoredActions[0]).toHaveProperty("click");
      expect(scoredActions[1]).toHaveProperty("rating");
    });
  });

  describe("train", () => {
    it("training the bandit should change the weights of the oracle", () => {
      const oldWeights: Array<{ [feature: string]: number }> =
        bandit.oracles.map((oracle) => {
          return { ...oracle.weights };
        });
      const trainingData: ITrainingData[] = [
        {
          actionId: "apple",
          context: { morning: 1 },
          actionFeatures: { fruit: 1 },
          click: 1,
        },
        {
          actionId: "pear",
          context: { morning: 1 },
          actionFeatures: { fruit: 1 },
          click: 1,
        },
        {
          actionId: "chocolate",
          context: { morning: 1 },
          actionFeatures: { fruit: 0 },
          click: 0,
        },
        {
          actionId: "chocolate",
          context: { morning: 1 },
          actionFeatures: { fruit: 0 },
          rating: 1,
        },
        {
          actionId: "apple",
          context: { morning: 0 },
          actionFeatures: { fruit: 1 },
          rating: 0,
        },
      ];
      bandit.train(trainingData);
      for (let i = 0; i < bandit.oracles.length; i++) {
        expect(bandit.oracles[i].weights).not.toEqual(oldWeights[i]);
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
      it("the weights of the oracle should be changed", () => {
        const oldWeights = { ...bandit.oracles[0].weights };
        bandit.accept(recommendation);
        expect(bandit.oracles[0].weights).not.toEqual(oldWeights);
      });
    });
    describe("reject", () => {
      it("the weights of the oracle should be changed", () => {
        bandit.accept(recommendation);
        const oldWeights = { ...bandit.oracles[0].weights };
        bandit.reject(recommendation);
        expect(bandit.oracles[0].weights).not.toEqual(oldWeights);
      });
    });
    describe("feedback", () => {
      it("the weights of the oracle should be changed", () => {
        const oldWeights = { ...bandit.oracles[1].weights };
        bandit.feedback(recommendation, "rating", 1);
        expect(bandit.oracles[1].weights).not.toEqual(oldWeights);
      });
    });
  });
});
