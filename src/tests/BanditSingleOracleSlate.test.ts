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
  const slateSize = 2;

  beforeEach(() => {
    oracle = new SimpleOracle({
      actionIds: actionIds,
      context: ["morning"],
      features: ["fruit"],
      learningRate: 1.0,
    });
    bandit = new SimpleBandit({
      oracle: oracle,
      actions: actions,
      temperature: 0.5,
      slateSize: slateSize,
    });
  });

  describe("constructor", () => {
    it("should create an instance of SimpleBandit with the correct properties", () => {
      expect(bandit.oracle).toEqual([oracle]);
      expect(bandit.temperature).toEqual(0.5);
      expect(bandit.slateSize).toEqual(2);
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
    it("training the bandit should change the weights of the oracle", async () => {
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
          recommendationId: "recommendation2",
          actionId: "pear",
          probability: 0.5,
          context: { morning: 1 },
          features: { fruit: 1 },
          click: 1,
        },
        {
          recommendationId: "recommendation2",
          actionId: "chocolate",
          probability: 0.5,
          context: { morning: 1 },
          features: { fruit: 0 },
          click: 0,
        },
      ];
      await bandit.train(trainingData);
      expect(bandit.oracle[0].weights).not.toEqual(oldWeights);
    });
  });

  describe("slate", () => {
    const context: { [feature: string]: number } = { morning: 1 };
    let slate: ISlate;
    beforeEach(() => {
      slate = bandit.slate(context);
    });

    it("slate context should equal input context", () => {
      expect(slate.context).toEqual(context);
    });
    it("slate should have both an actionId a score and a probability that is defined", () => {
      expect(slate.slateItems).toBeInstanceOf(Array);
      slate.slateItems.forEach((action) => {
        expect(action.actionId).toBeDefined();
        expect(action.score).toBeDefined();
        expect(action.probability).toBeDefined();
      });
    });

    describe("should always pick the highest scored actions with temperature=0", () => {
      it("should always pick the highest scored actions with temperature=0", () => {
        const bandit = new SimpleBandit({
          oracle: new SimpleOracle({ weights: { action2: 1, action3: 2 } }),
          actions: ["action1", "action2", "action3"],
          temperature: 0,
          slateSize: 3,
        });
        for (let i = 0; i < 10; i++) {
          const slate = bandit.slate();
          expect(slate.slateItems[0].actionId).toEqual("action3");
          expect(slate.slateItems[1].actionId).toEqual("action2");
          expect(slate.slateItems[2].actionId).toEqual("action1");
        }
      });
    });

    describe("choose", () => {
      it("the weights of the oracle should be changed", async () => {
        const oldWeights = { ...bandit.oracle[0].weights };
        await bandit.choose(slate, slate.slateItems[0].actionId);
        expect(bandit.oracle[0].weights).not.toEqual(oldWeights);
      });
    });

    describe("rejectAll", () => {
      it("the weights of the oracle should be changed", async () => {
        const oldWeights = { ...bandit.oracle[0].weights };
        await bandit.reject(slate);
        expect(bandit.oracle[0].weights).not.toEqual(oldWeights);
      });
    });

    describe("recommendationId should match in trainingData", () => {
      it("should have a trainingData entry with the same recommendationId", async () => {
        const trainingData = await bandit.choose(
          slate,
          slate.slateItems[0].actionId,
        );
        expect(
          trainingData.filter(
            (data) => data.recommendationId === slate.recommendationId,
          ).length,
        ).toEqual(slateSize);
      });
    });
  });

  describe("for different slate sizes", () => {
    beforeEach(() => {
      bandit = new SimpleBandit({ actions: actions, slateSize: 2 });
    });
    it("should return the default slate size by default", () => {
      const slate = bandit.slate();
      expect(slate.slateItems.length).toEqual(2);
    });
    it("should return the correct slate size when specified", () => {
      const slate = bandit.slate({}, { slateSize: 3 });
      expect(slate.slateItems.length).toEqual(3);
    });
    it("should slate size of actions if slateSize is larger than actions", () => {
      const slate = bandit.slate({}, { slateSize: 10 });
      expect(slate.slateItems.length).toEqual(actions.length);
    });
  });
});
