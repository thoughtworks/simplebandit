import { SimpleOracle } from "../SimpleOracle";
import { SimpleBandit } from "../SimpleBandit";
import { ISimpleBanditState } from "../interfaces/IState";
import { IScoredAction } from "../interfaces/IAction";
import { IRecommendation } from "../interfaces/IRecommendation";
import { ITrainingData } from "../interfaces/ITrainingData";

describe("Single Oracle Bandit Recommendation", () => {
  let oracle: SimpleOracle;
  let bandit: SimpleBandit;
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

  beforeEach(() => {
    oracle = new SimpleOracle({
      actionIds: actionIds,
      context: ["morning"],
      features: ["fruit"],
      learningRate: 1.0,
    });
    bandit = new SimpleBandit({
      oracles: [oracle],
      actions: actions,
      temperature: 0.5,
      slateSize: 1,
    });
  });

  describe("constructor", () => {
    it("should create an instance of SimpleBandit with the correct properties", () => {
      expect(bandit.oracles).toEqual([oracle]);
      expect(bandit.temperature).toEqual(0.5);
      expect(bandit.slateSize).toEqual(1);
      expect(bandit.actionsMap).toBeDefined();
      expect(bandit.actionsMap).toHaveProperty("apple");
      expect(bandit.actionsMap).toHaveProperty("pear");
      expect(bandit.actionsMap).toHaveProperty("chocolate");
    });
  });

  describe("pass actionIds as actions", () => {
    it("should create an instance of SimpleBandit with the correct properties", () => {
      const bandit = new SimpleBandit({
        actions: ["action1", "action2"],
      });
      expect(bandit.oracles).toBeDefined();
      expect(bandit.temperature).toEqual(0.5);
      expect(bandit.slateSize).toEqual(1);
      expect(bandit.actionsMap).toBeDefined();
      expect(bandit.actionsMap).toHaveProperty("action1");
      expect(bandit.actionsMap).toHaveProperty("action2");
    });
  });

  describe("pass actionIds as actions", () => {
    it("should create an instance of SimpleBandit with a mix of actionId and IActions", () => {
      const bandit = new SimpleBandit({
        actions: [{ actionId: "action1", features: { night: 1 } }, "action2"],
      });
      expect(bandit.oracles).toBeDefined();
      expect(bandit.temperature).toEqual(0.5);
      expect(bandit.slateSize).toEqual(1);
      expect(bandit.actionsMap).toBeDefined();
      expect(bandit.actionsMap).toHaveProperty("action1");
      expect(bandit.actionsMap).toHaveProperty("action2");
      expect(bandit.actionsMap["action1"]).toEqual({
        actionId: "action1",
        features: { night: 1 },
      });
      expect(bandit.actionsMap["action2"]).toEqual({
        actionId: "action2",
        features: {},
      });
    });
  });

  describe("getBanditState", () => {
    it("should return the correct state", () => {
      const state: ISimpleBanditState = {
        oracleStates: [oracle.getOracleState()],
        temperature: 0.5,
        slateSize: 1,
      };
      expect(bandit.toState()).toEqual(state);
    });
  });

  describe("toJSON", () => {
    it("should return the correct JSON string", () => {
      const state: ISimpleBanditState = {
        oracleStates: [oracle.getOracleState()],
        temperature: 0.5,
        slateSize: 1,
      };
      expect(bandit.toJSON()).toEqual(JSON.stringify(state));
    });
  });

  describe("fromJSON", () => {
    it("should return the correct instance", () => {
      const state: ISimpleBanditState = {
        oracleStates: [oracle.getOracleState()],
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
        expect(scoredAction).toHaveProperty("probability");
      });
    });
  });

  describe("train", () => {
    it("training the bandit should change the weights of the oracle", () => {
      const oldWeights = { ...bandit.oracles[0].weights };
      const trainingData: ITrainingData[] = [
        {
          actionId: "apple",
          probability: 0.5,
          context: { morning: 1 },
          features: { fruit: 1 },
          click: 1,
        },
        {
          actionId: "pear",
          probability: 0.5,
          context: { morning: 1 },
          features: { fruit: 1 },
          click: 1,
        },
        {
          actionId: "chocolate",
          probability: 0.5,
          context: { morning: 1 },
          features: { fruit: 0 },
          click: 0,
        },
      ];
      bandit.train(trainingData);
      expect(bandit.oracles[0].weights).not.toEqual(oldWeights);
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
        const oldWeights = { ...bandit.oracles[0].weights };
        bandit.reject(recommendation);
        expect(bandit.oracles[0].weights).not.toEqual(oldWeights);
      });
    });
  });
});
