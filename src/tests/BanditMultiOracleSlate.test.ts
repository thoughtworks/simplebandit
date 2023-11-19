import { SimpleOracle } from "../SimpleOracle";
import { SimpleBandit } from "../SimpleBandit";

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
      oracles: oracles,
      actions: actions,
      temperature: temperature,
      slateSize: 2,
    });
  });

  describe("constructor", () => {
    it("should create an instance of SimpleBandit with the correct properties", () => {
      expect(bandit.oracles).toEqual(oracles);
      expect(bandit.temperature).toEqual(temperature);
      expect(bandit.slateSize).toEqual(2);
    });
  });

  describe("slate", () => {
    it("should return a slate of the correct size", () => {
      const slate = bandit.slate({ morning: 1 });
      expect(slate.slateActions.length).toEqual(2);
    });
  });

  describe("oracle should update upon responding to a slate", () => {
    it("choose should update weights for click oracle", () => {
      const oldClickWeights = { ...bandit.oracles[0].weights };
      const oldRatingWeights = { ...oracles[1].weights };
      const slate = bandit.slate({ morning: 1 });
      const selectedActionId = slate.slateActions[0].actionId;
      bandit.choose(slate, selectedActionId);
      expect(oracles[0].weights).not.toEqual(oldClickWeights);
      expect(oracles[1].weights).toEqual(oldRatingWeights);
    });

    it("reject should update weights for click oracle", () => {
      const oldClickWeights = { ...bandit.oracles[0].weights };
      const oldRatingWeights = { ...oracles[1].weights };
      const slate = bandit.slate({ morning: 1 });

      bandit.reject(slate);
      expect(oracles[0].weights).not.toEqual(oldClickWeights);
      expect(oracles[1].weights).toEqual(oldRatingWeights);
    });

    it("feedback should update weights for rating oracle", () => {
      const oldClickWeights = { ...bandit.oracles[0].weights };
      const oldRatingWeights = { ...oracles[1].weights };
      const slate = bandit.slate({ morning: 1 });
      const selectedActionId = slate.slateActions[0].actionId;
      bandit.feedback(slate, "rating", 1, selectedActionId);
      expect(oracles[0].weights).toEqual(oldClickWeights);
      expect(oracles[1].weights).not.toEqual(oldRatingWeights);
    });
  });
});
