import { SimpleOracle, SimpleOracleOptions } from "../SimpleOracle";
import {
  ITrainingData,
  ISimpleOracleState,
} from "../interfaces";

describe("SimpleOracle", () => {
  const context = ["context1", "context2"];
  const actionFeatures = ["feature1", "feature2"];
  const actionIds = ["action1", "action2"];
  const learningRate = 0.1;
  const actionIdFeatures = true;
  const contextActionIdInteractions = false;
  const contextActionFeatureInteractions = true;
  const useInversePropensityWeighting = false;
  const targetLabel = "click";
  const name = "click";
  const oracleWeight = 1.0;
  const weights = {
    intercept: 0,
    action1: 0.1,
    action2: 0.2,
    feature1: 0.3,
    feature2: 0.4,
    "context1*feature1": 1,
  };

  let oracle: SimpleOracle;

  it("should throw error if context is not an array or undefined", () => {
    expect(() => {
      new SimpleOracle({
        context: "context" as any,
      } as SimpleOracleOptions);
    }).toThrow(
      "actionIds, context, actionFeatures must be arrays of strings or undefined.",
    );
  });

  it("should throw error if actionFeatures is not an array", () => {
    expect(() => {
      new SimpleOracle({
        actionFeatures: "actionFeatures" as any,
      } as SimpleOracleOptions);
    }).toThrow(
      "actionIds, context, actionFeatures must be arrays of strings or undefined.",
    );
  });

  it("should throw error if actionIds is not an array", () => {
    expect(() => {
      new SimpleOracle({
        actionIds: "actionIds" as any,
      } as SimpleOracleOptions);
    }).toThrow(
      "actionIds, context, actionFeatures must be arrays of strings or undefined.",
    );
  });

  it("should throw error if learningRate is not a number", () => {
    expect(() => {
      new SimpleOracle({
        learningRate: "learningRate" as any,
      } as SimpleOracleOptions);
    }).toThrow("Invalid argument: learningRate must be a positive number.");
  });

  it("should throw error if contextInteractions is not an boolean", () => {
    expect(() => {
      new SimpleOracle({
        contextActionIdInteractions: "contextActionIdInteractions" as any,
      } as SimpleOracleOptions);
    }).toThrow(
      "actionIdFeatures, contextActionIdInteractions, contextActionFeatureInteractions, useInversePropensityWeighting must be booleans.",
    );
  });

  beforeEach(() => {
    oracle = new SimpleOracle({
      actionIds: actionIds,
      context: context,
      actionFeatures: actionFeatures,
      learningRate: learningRate,
      actionIdFeatures: actionIdFeatures,
      contextActionIdInteractions: contextActionIdInteractions,
      contextActionFeatureInteractions: contextActionFeatureInteractions,
      useInversePropensityWeighting: useInversePropensityWeighting,
      targetLabel: targetLabel,
      weights: weights,
    } as SimpleOracleOptions);
  });

  describe("constructor", () => {
    it("should create an instance of SimpleOracle with the correct properties", () => {
      expect(oracle.context).toEqual(context);
      expect(oracle.actionFeatures).toEqual(actionFeatures);
      expect(oracle.actionIds).toEqual(actionIds);
      expect(oracle.learningRate).toEqual(learningRate);
      expect(oracle.addIntercept).toEqual(true);
      expect(oracle.actionIdFeatures).toEqual(actionIdFeatures);
      expect(oracle.contextActionIdInteractions).toEqual(
        contextActionIdInteractions,
      );
      expect(oracle.contextActionFeatureInteractions).toEqual(
        contextActionFeatureInteractions,
      );
      expect(oracle.useInversePropensityWeighting).toEqual(
        useInversePropensityWeighting,
      );
      expect(oracle.targetLabel).toEqual(targetLabel);
      expect(oracle.weights).toEqual(weights);
    });
  });

  describe("getOracleState", () => {
    it("should return the correct state", () => {
      const expectedOracleState: ISimpleOracleState = {
        context,
        actionFeatures,
        actionIds: actionIds,
        learningRate,
        actionIdFeatures,
        contextActionIdInteractions,
        contextActionFeatureInteractions,
        useInversePropensityWeighting,
        targetLabel,
        name,
        oracleWeight,
        weights: {
          intercept: 0,
          action1: 0.1,
          action2: 0.2,
          feature1: 0.3,
          feature2: 0.4,
          "context1*feature1": 1,
        },
      };

      expect(oracle.getOracleState()).toEqual(expectedOracleState);
    });
  });

  describe("fromOracleState", () => {
    it("should return an instance of LogisticOracle with the correct properties", () => {
      const oracleState: ISimpleOracleState = {
        actionIds,
        context,
        actionFeatures,
        learningRate,
        actionIdFeatures,
        contextActionIdInteractions,
        contextActionFeatureInteractions,
        useInversePropensityWeighting,
        targetLabel,
        name,
        oracleWeight,
        weights: {
          intercept: 0,
          action1: 0.1,
          action2: 0.2,
          feature1: 0.3,
          feature2: 0.4,
          "context1*feature1": 1,
        },
      };
      const newOracle = SimpleOracle.fromOracleState(oracleState);
      expect(newOracle.context).toEqual(context);
      expect(newOracle.actionFeatures).toEqual(actionFeatures);
      expect(newOracle.actionIds).toEqual(actionIds);
      expect(newOracle.learningRate).toEqual(learningRate);
      expect(newOracle.addIntercept).toEqual(true);
      expect(newOracle.contextActionIdInteractions).toEqual(
        contextActionIdInteractions,
      );
      expect(newOracle.contextActionFeatureInteractions).toEqual(
        contextActionFeatureInteractions,
      );
      expect(newOracle.useInversePropensityWeighting).toEqual(
        useInversePropensityWeighting,
      );
      expect(newOracle.targetLabel).toEqual(targetLabel);
      expect(newOracle.weights).toEqual(weights);
    });
  });

  describe("fromJSON", () => {
    it("should return an instance of LogisticOracle with the correct properties", () => {
      const newOracle = SimpleOracle.fromJSON(oracle.toJSON());
      expect(newOracle.actionIds).toEqual(actionIds);
      expect(newOracle.context).toEqual(context);
      expect(newOracle.actionFeatures).toEqual(actionFeatures);
      expect(newOracle.learningRate).toEqual(learningRate);
      expect(newOracle.addIntercept).toEqual(true);
      expect(newOracle.contextActionIdInteractions).toEqual(
        contextActionIdInteractions,
      );
      expect(newOracle.contextActionFeatureInteractions).toEqual(
        contextActionFeatureInteractions,
      );
      expect(newOracle.useInversePropensityWeighting).toEqual(
        useInversePropensityWeighting,
      );
      expect(newOracle.targetLabel).toEqual(targetLabel);
      expect(newOracle.weights).toEqual(weights);
    });
  });

  describe("toJSON", () => {
    it("should return a JSON object with the correct properties", () => {
      expect(oracle.toJSON()).toEqual(
        '{"actionIds":["action1","action2"],"context":["context1","context2"],"actionFeatures":["feature1","feature2"],"learningRate":0.1,"actionIdFeatures":true,"contextActionIdInteractions":false,"contextActionFeatureInteractions":true,"useInversePropensityWeighting":false,"targetLabel":"click","name":"click","oracleWeight":1,"weights":{"intercept":0,"action1":0.1,"action2":0.2,"feature1":0.3,"feature2":0.4,"context1*feature1":1}}',
      );
    });
  });

  describe("sigmoid", () => {
    it("should return 0.5 for 0", () => {
      expect(oracle._sigmoid(0)).toEqual(0.5);
    });
    it("should return approximately 0.731 for 1", () => {
      expect(oracle._sigmoid(1)).toBeCloseTo(0.731, 3);
    });
    it("should return approximately 0.269 for -1", () => {
      expect(oracle._sigmoid(-1)).toBeCloseTo(0.269, 3);
    });
  });

  describe("predict", () => {
    it("should return 0.5 for all zero features", () => {
      const context = {
        context1: 0,
        context2: 0,
      };
      const actionFeatures = {
        feature1: 0,
        feature2: 0,
      };
      const actionId = "action3";
      expect(oracle.predict(actionId, context, actionFeatures)).toEqual(0.5);
    });
    it("should return 0.73 for all features that add up to 1", () => {
      const context = {
        context1: 1,
        context2: 0,
      };
      const actionFeatures = {
        feature1: 1,
        feature2: 0,
      };
      const actionId = "action3";
      expect(oracle.predict(actionId, context, actionFeatures)).toEqual(
        0.7310585786300049,
      );
    });
    it("should return 0.2689 for all features that add up to 1", () => {
      const context = {
        context1: 1,
        context2: 0,
      };
      const actionFeatures = {
        feature1: -1,
        feature2: 0,
      };
      const actionId = "action3";
      expect(oracle.predict(actionId, context, actionFeatures)).toBeCloseTo(
        0.2689,
        3,
      );
    });
  });

  describe("fit", () => {
    it("should return an array of weights that are different from the previous weights", () => {
      let trainingData: ITrainingData = {
        actionId: "action1",
        context: { context1: 1, context2: 0 },
        actionFeatures: { feature1: 1, feature2: 0 },
        click: 1,
        probability: 0.5,
      };
      const oldWeights = { ...oracle.weights };
      oracle.fit(trainingData as any);
      expect(oracle.weights).not.toEqual(oldWeights);
      expect(oracle.weights["action1"]).toBeCloseTo(0.147, 2);
    });
  });
});
