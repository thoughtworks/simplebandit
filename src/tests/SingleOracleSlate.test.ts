import { SimpleOracle } from "../SimpleOracle";
import { SimpleBandit } from "../SimpleBandit";
import { ISimpleBanditState } from "../interfaces/IState";
import { IScoredAction } from "../interfaces/IAction";
import { ISlate } from "../interfaces/IRecommendation";
import { ITrainingData } from "../interfaces/ITrainingData";

describe("SimpleBandit with slates", () => {
  let oracle: SimpleOracle;
  let bandit: SimpleBandit;
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
    bandit = new SimpleBandit({
      oracles: oracle,
      actions: actions,
      temperature: 0.5,
      slateSize: 2,
    });
  });

  describe("constructor", () => {
    it("should create an instance of SimpleBandit with the correct properties", () => {
      expect(bandit.oracles).toEqual([oracle]);
      expect(bandit.temperature).toEqual(0.5);
      expect(bandit.slateSize).toEqual(2);
    });
  });

  describe("fromContextAndActions", () => {
    it("should create an instance of SimpleBandit with the correct properties", () => {
      const bandit = SimpleBandit.fromContextAndActions({
        context: ["morning"],
        actions: actions,
        temperature: 0.5,
        learningRate: 1.0,
        slateSize: 2,
      });
      expect(bandit.oracles).toBeDefined();
      expect(bandit.oracles[0].learningRate).toEqual(1.0);
      expect(bandit.temperature).toEqual(0.5);
      expect(bandit.slateSize).toEqual(2);
    });
  });

  describe("fromContextAndActionIds", () => {
    it("should create an instance of MultiBandit with the correct properties", () => {
      const bandit = SimpleBandit.fromContextAndActionIds({
        context: ["morning"],
        actionIds: actionIds,
        temperature: 0.5,
        learningRate: 1.0,
        slateSize: 2,
      });
      expect(bandit.oracles).toBeDefined();
      expect(bandit.oracles[0].learningRate).toEqual(1.0);
      expect(bandit.temperature).toEqual(0.5);
      expect(bandit.slateSize).toEqual(2);
      expect(bandit.actionsMap).toBeDefined();
      actionIds.forEach((id) => {
        expect(bandit.actionsMap).toHaveProperty(id);
        expect(bandit.actionsMap[id].features).toEqual({});
      });
    });
  });

  describe("fromActions", () => {
    it("should create an instance of MultiBandit with the correct properties", () => {
      const bandit = SimpleBandit.fromActions({
        actions: actions,
        temperature: 0.5,
        learningRate: 1.0,
        slateSize: 2,
      });
      expect(bandit.oracles).toBeDefined();
      expect(bandit.oracles[0].learningRate).toEqual(1.0);
      expect(bandit.temperature).toEqual(0.5);
      expect(bandit.slateSize).toEqual(2);
      expect(bandit.actionsMap).toBeDefined();
      actionIds.forEach((id) => {
        expect(bandit.actionsMap).toHaveProperty(id);
      });
      ["apple", "pear", "banana"].forEach((fruit) => {
        expect(bandit.actionsMap[fruit].features).toEqual({ fruit: 1 });
      });
      ["chocolate", "candy"].forEach((fruit) => {
        expect(bandit.actionsMap[fruit].features).toEqual({ fruit: 0 });
      });
    });
  });

  describe("fromActionIds", () => {
    it("should create an instance of MultiBandit with the correct properties", () => {
      const bandit = SimpleBandit.fromActionIds({
        actionIds: actionIds,
        temperature: 0.5,
        learningRate: 1.0,
        slateSize: 2,
      });
      expect(bandit.oracles).toBeDefined();
      expect(bandit.oracles[0].learningRate).toEqual(1.0);
      expect(bandit.temperature).toEqual(0.5);
      expect(bandit.slateSize).toEqual(2);
      expect(bandit.actionsMap).toBeDefined();
      actionIds.forEach((id) => {
        expect(bandit.actionsMap).toHaveProperty(id);
        expect(bandit.actionsMap[id].features).toEqual({});
      });
    });
  });

  describe("getBanditState", () => {
    it("should return the correct state", () => {
      const state: ISimpleBanditState = {
        oracleStates: [oracle.getOracleState()],
        temperature: 0.5,
        slateSize: 2,
      };
      expect(bandit.toState()).toEqual(state);
    });
  });

  describe("toJSON", () => {
    it("should return the correct JSON string", () => {
      const state: ISimpleBanditState = {
        oracleStates: [oracle.getOracleState()],
        temperature: 0.5,
        slateSize: 2,
      };
      expect(bandit.toJSON()).toEqual(JSON.stringify(state));
    });
  });

  describe("fromJSON", () => {
    it("should return the correct instance", () => {
      const state: ISimpleBanditState = {
        oracleStates: [oracle.getOracleState()],
        temperature: 0.5,
        slateSize: 2,
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
      const oldWeights = { ...bandit.oracles[0].weights };
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
      ];
      bandit.train(trainingData);
      expect(bandit.oracles[0].weights).not.toEqual(oldWeights);
    });
  });

  describe("recommend", () => {
    const context: { [feature: string]: number } = { morning: 1 };
    let slate: ISlate;
    beforeEach(() => {
      slate = bandit.slate(context);
    });

    it("slate context should equal input context", () => {
      expect(slate.context).toEqual(context);
    });
    it("slate should have both an actionId a score and a probability that is defined", () => {
      expect(slate.slateActions).toBeInstanceOf(Array);
      slate.slateActions.forEach((action) => {
        expect(action.actionId).toBeDefined();
        expect(action.score).toBeDefined();
        expect(action.probability).toBeDefined();
      });
    });
    describe("choose", () => {
      it("the weights of the oracle should be changed", () => {
        const oldWeights = { ...bandit.oracles[0].weights };
        bandit.choose(slate, slate.slateActions[0].actionId);
        expect(bandit.oracles[0].weights).not.toEqual(oldWeights);
      });
    });
    describe("rejectAll", () => {
      it("the weights of the oracle should be changed", () => {
        const oldWeights = { ...bandit.oracles[0].weights };
        bandit.reject(slate);
        expect(bandit.oracles[0].weights).not.toEqual(oldWeights);
      });
    });
  });
});
