import { SimpleOracle } from "../SimpleOracle";
import { SimpleBandit } from "../SimpleBandit";
import { ISimpleBanditState } from "../interfaces/IState";
import { IScoredAction } from "../interfaces/IAction";
import { IRecommendation } from "../interfaces/IRecommendation";
import { ITrainingData } from "../interfaces/ITrainingData";

describe("SimpleBandit takes all accepted actions inputs", () => {
  it("should accept an array of IActions", () => {
    const bandit = new SimpleBandit({
      actions: [
        {
          actionId: "action1",
          features: { night: 1 },
        },
        {
          actionId: "action2",
          features: { night: 0 },
        },
      ],
    });
    expect(bandit.actionsMap).toHaveProperty("action1");
    expect(bandit.actionsMap).toHaveProperty("action2");
    expect(bandit.actionsMap["action1"]).toEqual({
      actionId: "action1",
      features: { night: 1 },
    });
    expect(bandit.actionsMap["action2"]).toEqual({
      actionId: "action2",
      features: { night: 0 },
    });
  });
  it("should accept an array of actionIds", () => {
    const bandit = new SimpleBandit({
      actions: ["action1", "action2"],
    });
    expect(bandit.actionsMap).toHaveProperty("action1");
    expect(bandit.actionsMap).toHaveProperty("action2");
    expect(bandit.actionsMap["action1"]).toEqual({
      actionId: "action1",
      features: {},
    });
    expect(bandit.actionsMap["action2"]).toEqual({
      actionId: "action2",
      features: {},
    });
  });
  it("should accept an object of actionIds with empty lists", () => {
    const bandit = new SimpleBandit({
      actions: { action1: [], action2: [] },
    });
    expect(bandit.actionsMap).toHaveProperty("action1");
    expect(bandit.actionsMap).toHaveProperty("action2");
    expect(bandit.actionsMap["action1"]).toEqual({
      actionId: "action1",
      features: {},
    });
    expect(bandit.actionsMap["action2"]).toEqual({
      actionId: "action2",
      features: {},
    });
  });
  it("should accept an object of actionIds with string lists", () => {
    const bandit = new SimpleBandit({
      actions: { action1: ["night"], action2: ["morning", "day"] },
    });
    expect(bandit.actionsMap).toHaveProperty("action1");
    expect(bandit.actionsMap).toHaveProperty("action2");
    expect(bandit.actionsMap["action1"]).toEqual({
      actionId: "action1",
      features: { night: 1 },
    });
    expect(bandit.actionsMap["action2"]).toEqual({
      actionId: "action2",
      features: { morning: 1, day: 1 },
    });
  });
  it("should accept an object of actionsIds with feature hashes", () => {
    const bandit = new SimpleBandit({
      actions: {
        action1: { night: 1 },
        action2: { morning: 1, day: 1 },
      },
    });
    expect(bandit.actionsMap).toHaveProperty("action1");
    expect(bandit.actionsMap).toHaveProperty("action2");
    expect(bandit.actionsMap["action1"]).toEqual({
      actionId: "action1",
      features: { night: 1 },
    });
    expect(bandit.actionsMap["action2"]).toEqual({
      actionId: "action2",
      features: { morning: 1, day: 1 },
    });
  });
});

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
      oracle: [oracle],
      actions: actions,
      temperature: 0.5,
      slateSize: 1,
    });
  });

  describe("constructor", () => {
    it("should create an instance of SimpleBandit with the correct properties", () => {
      expect(bandit.oracle).toEqual([oracle]);
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
      expect(bandit.oracle).toBeDefined();
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
      expect(bandit.oracle).toBeDefined();
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

    it("should contain all the actionIds", () => {
      const scoredActionIds = scoredActions.map(
        (scoredAction) => scoredAction.actionId,
      );
      expect(scoredActionIds).toEqual(actionIds);
    });

    it("should respect the include parameter", () => {
      const scoredActions = bandit.getScoredActions(context, {
        include: ["apple"],
      });
      expect(scoredActions.length).toEqual(1);
      expect(scoredActions[0].actionId).toEqual("apple");
    });

    it("should respect the exclude parameter", () => {
      const scoredActions = bandit.getScoredActions(context, {
        exclude: ["apple"],
      });
      expect(scoredActions.length).toEqual(2);
      const scoredActionIds = scoredActions.map(
        (scoredAction) => scoredAction.actionId,
      );
      expect(scoredActionIds).not.toContain("apple");
    });
  });

  describe("train", () => {
    it("training the bandit should change the weights of the oracle", () => {
      const oldWeights = { ...bandit.oracle[0].weights };
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
          recommendationId: "recommendation1",
          actionId: "pear",
          probability: 0.5,
          context: { morning: 1 },
          features: { fruit: 1 },
          click: 0,
        },
        {
          recommendationId: "recommendation1",
          actionId: "chocolate",
          probability: 0.5,
          context: { morning: 1 },
          features: { fruit: 0 },
          click: 0,
        },
      ];
      bandit.train(trainingData);
      expect(bandit.oracle[0].weights).not.toEqual(oldWeights);
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
        const oldWeights = { ...bandit.oracle[0].weights };
        bandit.accept(recommendation);
        expect(bandit.oracle[0].weights).not.toEqual(oldWeights);
      });
    });
    describe("reject", () => {
      it("the weights of the oracle should be changed", () => {
        const oldWeights = { ...bandit.oracle[0].weights };
        bandit.reject(recommendation);
        expect(bandit.oracle[0].weights).not.toEqual(oldWeights);
      });
    });
    describe("recommendationId should match in trainingData", () => {
      it("should have a trainingData entry with the same recommendationId", async () => {
        const trainingData = await bandit.accept(recommendation);
        expect(
          trainingData.filter(
            (data) => data.recommendationId === recommendation.recommendationId,
          ).length,
        ).toEqual(1);
      });
    });
  });
});
