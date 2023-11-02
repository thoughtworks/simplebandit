import { SimpleOracle } from "../SimpleOracle";
import { SimpleBandit } from "../SimpleBandit";
import { ISimpleBanditState } from "../interfaces/ISimpleBandit";
import { IScoredAction } from "../interfaces/IAction";
import { IRecommendation } from "../interfaces/IRecommendation";
import { ITrainingData } from "../interfaces/ITrainingData";

describe("SimpleBandit", () => {
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
      actionFeatures: ["fruit"],
      learningRate: 1.0,
    });
    bandit = new SimpleBandit(oracle, actions, 5.0);
  });

  describe("constructor", () => {
    it("should create an instance of SimpleBandit with the correct properties", () => {
      expect(bandit.oracle).toEqual(oracle);
      expect(bandit.softmaxBeta).toEqual(5.0);
    });
  });

  describe("fromContextAndActions", () => {
    it("should create an instance of SimpleBandit with the correct properties", () => {
      const bandit = SimpleBandit.fromContextAndActions(
        ["morning"],
        actions,
        5.0,
        1.0
      );
      expect(bandit.oracle).toBeDefined();
      expect(bandit.softmaxBeta).toEqual(5.0);
    });
  });

  describe("fromContextAndActionIds", () => {
    it("should create an instance of SimpleBandit with the correct properties", () => {
      const bandit = SimpleBandit.fromContextAndActionIds(
        ["morning"],
        actionIds,
        5.0,
        1.0
      );
      expect(bandit.oracle).toBeDefined();
      expect(bandit.softmaxBeta).toEqual(5.0);
    });
  });

  describe("fromActions", () => {
    it("should create an instance of SimpleBandit with the correct properties", () => {
      const bandit = SimpleBandit.fromActions(actions, 5.0, 1.0);
      expect(bandit.oracle).toBeDefined();
      expect(bandit.softmaxBeta).toEqual(5.0);
    });
  });

  describe("fromActionIds", () => {
    it("should create an instance of SimpleBandit with the correct properties", () => {
      const bandit = SimpleBandit.fromActionIds(actionIds, 5.0, 1.0);
      expect(bandit.oracle).toBeDefined();
      expect(bandit.softmaxBeta).toEqual(5.0);
    });
  });

  describe("getBanditState", () => {
    it("should return the correct state", () => {
      const state: ISimpleBanditState = {
        oracleState: oracle.getOracleState(),
        softmaxBeta: 5.0,
      };
      expect(bandit.getSimpleBanditState()).toEqual(state);
    });
  });

  describe("toJSON", () => {
    it("should return the correct JSON string", () => {
      const state: ISimpleBanditState = {
        oracleState: oracle.getOracleState(),
        softmaxBeta: 5.0,
      };
      expect(bandit.toJSON()).toEqual(JSON.stringify(state));
    });
  });

  describe("fromJSON", () => {
    it("should return the correct instance", () => {
      const state: ISimpleBanditState = {
        oracleState: oracle.getOracleState(),
        softmaxBeta: 5.0,
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
    let recommendation: IRecommendation;
    beforeEach(() => {
      recommendation = bandit.makeRecommendation(context);
    });

    it("recommendation context should equal input context", () => {
      expect(recommendation.context).toEqual(context);
    });
    it("recommendation should have both an actionId a score and a probability that is defined", () => {
      expect(recommendation.actionId).toBeDefined();
      expect(recommendation.score).toBeDefined();
      expect(recommendation.probability).toBeDefined();
    });
    describe("AcceptRecommendation", () => {
      it("the weights of the oracle should be changed", () => {
        const oldWeights = bandit.oracle.weights.slice();
        bandit.acceptRecommendation(recommendation);
        expect(bandit.oracle.weights).not.toEqual(oldWeights);
      });
    });
    describe("rejectRecommendation", () => {
      it("the weights of the oracle should be changed", () => {
        const oldWeights = bandit.oracle.weights.slice();
        bandit.rejectRecommendation(recommendation);
        expect(bandit.oracle.weights).not.toEqual(oldWeights);
      });
    });
  });
});
