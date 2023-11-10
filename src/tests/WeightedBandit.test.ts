import { SimpleOracle, WeightedOracle } from "../SimpleOracle";
import { WeightedBandit } from "../Bandits";
// import { ISimpleBanditState } from "../interfaces/IState";
import { IScoredAction } from "../interfaces/IAction";
import { IRecommendation } from "../interfaces/IRecommendation";
import { ITrainingData } from "../interfaces/ITrainingData";
import { IWeightedBanditState } from "../interfaces/IState";
import { WeightsHash } from "../interfaces/ISimpleOracle";

describe("WeightedBandit", () => {
  let weightedOracles: WeightedOracle[];
  let bandit: WeightedBandit;
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
  const temperature = 0.5

  beforeEach(() => {
    weightedOracles = [
      {
        oracle: new SimpleOracle({
          actionIds: actionIds,
          context: ["morning"],
          actionFeatures: ["fruit"],
          targetLabel: "click",
          learningRate: 1.0,
        }),
        weight: 0.5,
      },
      {
        oracle: new SimpleOracle({
          actionIds: actionIds,
          context: ["morning"],
          actionFeatures: ["fruit"],
          targetLabel: "rating",
          learningRate: 1.0,
        }),
        weight: 0.5,
      },
    ];

    bandit = new WeightedBandit(weightedOracles, actions, temperature);
  });

  describe("constructor", () => {
    it("should create an instance of SimpleBandit with the correct properties", () => {
      expect(bandit.weightedOracles).toEqual(weightedOracles);
      expect(bandit.temperature).toEqual(temperature);
    });
  });

  
  describe("getBanditState", () => {
    it("should return the correct state", () => {
      const state: IWeightedBanditState = {
        oraclesStates: [
          {
            weight: weightedOracles[0].weight,
            oracleState: weightedOracles[0].oracle.getOracleState(),
            
          },
          {
            weight: weightedOracles[1].weight,
            oracleState: weightedOracles[1].oracle.getOracleState(),
          },
        ],
        temperature: 0.5,
      };
      expect(bandit.toState()).toEqual(state);
    });
  });

  describe("toJSON", () => {
    it("should return the correct JSON string", () => {
      const state: IWeightedBanditState = {
        oraclesStates: [
          {
            weight: weightedOracles[0].weight,
            oracleState: weightedOracles[0].oracle.getOracleState(),
            
          },
          {
            weight: weightedOracles[1].weight,
            oracleState: weightedOracles[1].oracle.getOracleState(),
          },
        ],
        temperature: 0.5,
      };
      expect(bandit.toJSON()).toEqual(JSON.stringify(state));
    });
  });

  describe("fromJSON", () => {
    it("should return the correct instance", () => {
      const state: IWeightedBanditState = {
        oraclesStates: [
          {
            weight: weightedOracles[0].weight,
            oracleState: weightedOracles[0].oracle.getOracleState(),
            
          },
          {
            weight: weightedOracles[1].weight,
            oracleState: weightedOracles[1].oracle.getOracleState(),
            
          },
        ],
        temperature: 0.5,
      };
      const bandit2 = WeightedBandit.fromJSON(JSON.stringify(state), actions);
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
      const oldWeights:number[][] = bandit.weightedOracles.map((weightedOracle) => weightedOracle.oracle.weights.slice());
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
      for (let i = 0; i < bandit.weightedOracles.length; i++) {
        console.log(bandit.weightedOracles[i].oracle.weights)
        expect(bandit.weightedOracles[i].oracle.weights).not.toEqual(oldWeights[i]);
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
        const oldWeights = bandit.weightedOracles[0].oracle.weights.slice();
        bandit.accept(recommendation);
        expect(bandit.weightedOracles[0].oracle.weights).not.toEqual(oldWeights);
      });
    });
    describe("reject", () => {
      it("the weights of the oracle should be changed", () => {
        bandit.accept(recommendation);
        const oldWeights = bandit.weightedOracles[0].oracle.weights.slice();
        bandit.reject(recommendation);
        expect(bandit.weightedOracles[0].oracle.weights).not.toEqual(oldWeights);
      });
    });
    describe("feedback", () => {
      it("the weights of the oracle should be changed", () => {
        const oldWeights = bandit.weightedOracles[1].oracle.weights.slice();
        bandit.feedback(recommendation, "rating", 1);
        expect(bandit.weightedOracles[1].oracle.weights).not.toEqual(oldWeights);
      });
    });
  });
});
