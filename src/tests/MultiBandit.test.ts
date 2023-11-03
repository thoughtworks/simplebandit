import { SimpleOracle } from "../SimpleOracle";
import { MultiBandit } from "../MultiBandit";
import { IMultiBanditState } from "../interfaces/IMultiBandit";
import { IScoredAction } from "../interfaces/IAction";
import { IMultiRecommendation } from "../interfaces/IRecommendation";
import { ITrainingData } from "../interfaces/ITrainingData";

describe("MultiBandit", () => {
  let oracle: SimpleOracle;
  let bandit: MultiBandit;
  const actionIds = ["apple", "pear", "banana", "chocolate", "candy"];
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
      actionId: "banana",
      features: { fruit: 1 },
    },
    {
      actionId: "chocolate",
      features: { fruit: 0 },
    },
    {
      actionId: "candy",
      features: { fruit: 0 },
    },
  ];

  beforeEach(() => {
    oracle = new SimpleOracle({
      actionIds: actionIds,
      context: ["morning"],
      actionFeatures: ["fruit"],
      learningRate: 1.0,
    });
    bandit = new MultiBandit(oracle, actions, 5.0, 2);
  });

  describe("constructor", () => {
    it("should create an instance of SimpleBandit with the correct properties", () => {
      expect(bandit.oracle).toEqual(oracle);
      expect(bandit.temperature).toEqual(5.0);
      expect(bandit.nRecommendations).toEqual(2);
    });
  });

  describe("fromContextAndActions", () => {
    it("should create an instance of MultiBandit with the correct properties", () => {
      const bandit = MultiBandit.fromContextAndActions({
        context: ["morning"],
        actions: actions,
        temperature: 5.0,
        learningRate: 1.0,
      });
      expect(bandit.oracle).toBeDefined();
      expect(bandit.temperature).toEqual(5.0);
    });
  });

  describe("fromContextAndActionIds", () => {
    it("should create an instance of MultiBandit with the correct properties", () => {
      const bandit = MultiBandit.fromContextAndActionIds({
        context: ["morning"],
        actionIds: actionIds,
        temperature: 5.0,
        learningRate: 1.0,
      });
      expect(bandit.oracle).toBeDefined();
      expect(bandit.temperature).toEqual(5.0);
    });
  });

  describe("fromActions", () => {
    it("should create an instance of MultiBandit with the correct properties", () => {
      const bandit = MultiBandit.fromActions({
        actions: actions,
        temperature: 5.0,
        learningRate: 1.0,
        nRecommendations: 2,
      });
      expect(bandit.oracle).toBeDefined();
      expect(bandit.temperature).toEqual(5.0);
    });
  });

  describe("fromActionIds", () => {
    it("should create an instance of MultiBandit with the correct properties", () => {
      const bandit = MultiBandit.fromActionIds({
        actionIds: actionIds,
        temperature: 5.0,
        learningRate: 1.0,
        nRecommendations: 2,
      });
      expect(bandit.oracle).toBeDefined();
      expect(bandit.temperature).toEqual(5.0);
    });
  });

  describe("getBanditState", () => {
    it("should return the correct state", () => {
      const state: IMultiBanditState = {
        oracleState: oracle.getOracleState(),
        temperature: 5.0,
        nRecommendations: 2,
      };
      expect(bandit.getMultiBanditState()).toEqual(state);
    });
  });

  describe("toJSON", () => {
    it("should return the correct JSON string", () => {
      const state: IMultiBanditState = {
        oracleState: oracle.getOracleState(),
        temperature: 5.0,
        nRecommendations: 2,
      };
      expect(bandit.toJSON()).toEqual(JSON.stringify(state));
    });
  });

  describe("fromJSON", () => {
    it("should return the correct instance", () => {
      const state: IMultiBanditState = {
        oracleState: oracle.getOracleState(),
        temperature: 5.0,
        nRecommendations: 2,
      };
      const bandit2 = MultiBandit.fromJSON(JSON.stringify(state), actions);
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

  describe("train", () => {
    it("training the bandit should change the weights of the oracle", () => {
      const oldWeights = bandit.oracle.weights.slice();
      const trainingData: ITrainingData[] = [
        {
          actionId: "apple",
          context: { morning: 1 },
          actionFeatures: { fruit: 1 },
          label: 1,
        },
        {
          actionId: "pear",
          context: { morning: 1 },
          actionFeatures: { fruit: 1 },
          label: 1,
        },
        {
          actionId: "chocolate",
          context: { morning: 1 },
          actionFeatures: { fruit: 0 },
          label: 0,
        },
      ];
      bandit.train(trainingData);
      expect(bandit.oracle.weights).not.toEqual(oldWeights);
    });
  });

  describe("makeRecommendation", () => {
    const context: { [feature: string]: number } = { morning: 1 };
    let recommendation: IMultiRecommendation;
    beforeEach(() => {
      recommendation = bandit.makeRecommendation(context);
    });

    it("recommendation context should equal input context", () => {
      expect(recommendation.context).toEqual(context);
    });
    it("recommendation should have both an actionId a score and a probability that is defined", () => {
      expect(recommendation.recommendedActions).toBeInstanceOf(Array);
      recommendation.recommendedActions.forEach((action) => {
        expect(action.actionId).toBeDefined();
        expect(action.score).toBeDefined();
        expect(action.probability).toBeDefined();
      });
    });
    describe("chooseAction", () => {
      it("the weights of the oracle should be changed", () => {
        const oldWeights = bandit.oracle.weights.slice();
        bandit.chooseAction(recommendation, "apple");
        expect(bandit.oracle.weights).not.toEqual(oldWeights);
      });
    });
    describe("rejectAll", () => {
      it("the weights of the oracle should be changed", () => {
        const oldWeights = bandit.oracle.weights.slice();
        bandit.rejectAll(recommendation);
        expect(bandit.oracle.weights).not.toEqual(oldWeights);
      });
    });
  });
});
