import { SimpleOracle, SimpleOracleOptions } from "../SimpleOracle";
import { ITrainingData, ISimpleOracleState } from "../interfaces";

describe("SimpleOracle", () => {
  const context = ["context1", "context2"];
  const features = ["feature1", "feature2"];
  const actionIds = ["action1", "action2"];
  const learningRate = 0.1;
  const actionIdFeatures = true;
  const actionFeatures = true;
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
      "actionIds, context, features must be arrays of strings or undefined.",
    );
  });

  it("should throw error if features is not an array", () => {
    expect(() => {
      new SimpleOracle({
        features: "features" as any,
      } as SimpleOracleOptions);
    }).toThrow(
      "actionIds, context, features must be arrays of strings or undefined.",
    );
  });

  it("should throw error if actionIds is not an array", () => {
    expect(() => {
      new SimpleOracle({
        actionIds: "actionIds" as any,
      } as SimpleOracleOptions);
    }).toThrow(
      "actionIds, context, features must be arrays of strings or undefined.",
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
      "actionIdFeatures, actionFeatures, contextActionIdInteractions, contextActionFeatureInteractions, useInversePropensityWeighting must be booleans.",
    );
  });

  beforeEach(() => {
    oracle = new SimpleOracle({
      actionIds: actionIds,
      context: context,
      features: features,
      learningRate: learningRate,
      actionIdFeatures: actionIdFeatures,
      actionFeatures: actionFeatures,
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
      expect(oracle.features).toEqual(features);
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
        features,
        actionIds: actionIds,
        learningRate,
        actionIdFeatures,
        actionFeatures,
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
        features,
        learningRate,
        actionIdFeatures,
        actionFeatures,
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
      expect(newOracle.features).toEqual(features);
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

  describe("__getModelInputsWeightsAndLogit", () => {
    it("should return the correct model inputs and weights with empty weights", () => {
      oracle = new SimpleOracle();
      const context = {
        context1: 1,
        context2: 0,
      };
      const features = {
        feature1: 1,
        feature2: 0,
      };
      const actionId = "action1";
      const expectedModelInputs = {
        intercept: 1,
        action1: 1,
        feature1: 1,
        feature2: 0,
        "context1*feature1": 1,
        "context1*feature2": 0,
        "context2*feature1": 0,
        "context2*feature2": 0,
        "context1*action1": 1,
        "context2*action1": 0,
      };
      const expectedWeights = {
        intercept: 0,
        action1: 0,
        feature1: 0,
        feature2: 0,
        "context1*feature1": 0,
        "context1*feature2": 0,
        "context2*feature1": 0,
        "context2*feature2": 0,
        "context1*action1": 0,
        "context2*action1": 0,
      };
      const expectedLogit = 0;
      const { inputs, weights, logit } = oracle._getModelInputsWeightsAndLogit(
        actionId,
        context,
        features,
      );
      expect(inputs).toEqual(expectedModelInputs);
      expect(weights).toEqual(expectedWeights);
      expect(logit).toEqual(expectedLogit);
    });

    it("should return the correct model inputs and weights with limited context and features", () => {
      oracle = new SimpleOracle({
        context: ["context1"],
        features: ["feature1"],
      });
      const context = {
        context1: 1,
        context2: 0,
      };
      const features = {
        feature1: 1,
        feature2: 0,
      };
      const actionId = "action1";
      const expectedModelInputs = {
        intercept: 1,
        action1: 1,
        feature1: 1,
        "context1*feature1": 1,
        "context1*action1": 1,
      };
      const expectedWeights = {
        intercept: 0,
        action1: 0,
        feature1: 0,
        "context1*feature1": 0,
        "context1*action1": 0,
      };
      const expectedLogit = 0;
      const { inputs, weights, logit } = oracle._getModelInputsWeightsAndLogit(
        actionId,
        context,
        features,
      );
      expect(inputs).toEqual(expectedModelInputs);
      expect(weights).toEqual(expectedWeights);
      expect(logit).toEqual(expectedLogit);
    });

    it("should return the correct model inputs and weights with limited context and features", () => {
      oracle = new SimpleOracle({
        contextActionIdInteractions: false,
        contextActionFeatureInteractions: false,
      });
      const context = {
        context1: 1,
        context2: 0,
      };
      const features = {
        feature1: 1,
        feature2: 0,
      };
      const actionId = "action1";
      const expectedModelInputs = {
        intercept: 1,
        action1: 1,
        feature1: 1,
        feature2: 0,
      };
      const expectedWeights = {
        intercept: 0,
        action1: 0,
        feature1: 0,
        feature2: 0,
      };
      const expectedLogit = 0;
      const { inputs, weights, logit } = oracle._getModelInputsWeightsAndLogit(
        actionId,
        context,
        features,
      );
      expect(inputs).toEqual(expectedModelInputs);
      expect(weights).toEqual(expectedWeights);
      expect(logit).toEqual(expectedLogit);
    });

    it("should return the correct model inputs and weights with empty weights", () => {
      oracle = new SimpleOracle({
        actionIdFeatures: false,
        actionFeatures: false,
      });
      const context = {
        context1: 1,
        context2: 0,
      };
      const features = {
        feature1: 1,
        feature2: 0,
      };
      const actionId = "action1";
      const expectedModelInputs = {
        intercept: 1,
        "context1*feature1": 1,
        "context1*feature2": 0,
        "context2*feature1": 0,
        "context2*feature2": 0,
        "context1*action1": 1,
        "context2*action1": 0,
      };
      const expectedWeights = {
        intercept: 0,
        "context1*feature1": 0,
        "context1*feature2": 0,
        "context2*feature1": 0,
        "context2*feature2": 0,
        "context1*action1": 0,
        "context2*action1": 0,
      };
      const expectedLogit = 0;
      const { inputs, weights, logit } = oracle._getModelInputsWeightsAndLogit(
        actionId,
        context,
        features,
      );
      expect(inputs).toEqual(expectedModelInputs);
      expect(weights).toEqual(expectedWeights);
      expect(logit).toEqual(expectedLogit);
    });

    it("should return the correct model inputs and weights with empty weights", () => {
      oracle = new SimpleOracle({
        weights: {
          intercept: 1,
          action1: 1,
          feature1: 1,
          "context1*feature1": 1,
          "context2*feature1": 1,
          "context1*action1": 1,
        },
      });
      const context = {
        context1: 1,
        context2: 0,
      };
      const features = {
        feature1: 1,
        feature2: 0,
      };
      const actionId = "action1";
      const expectedModelInputs = {
        intercept: 1,
        action1: 1,
        feature1: 1,
        feature2: 0,
        "context1*feature1": 1,
        "context1*feature2": 0,
        "context2*feature1": 0,
        "context2*feature2": 0,
        "context1*action1": 1,
        "context2*action1": 0,
      };
      const expectedWeights = {
        intercept: 1,
        action1: 1,
        feature1: 1,
        feature2: 0,
        "context1*feature1": 1,
        "context1*feature2": 0,
        "context2*feature1": 1,
        "context2*feature2": 0,
        "context1*action1": 1,
        "context2*action1": 0,
      };
      const expectedLogit = 5;
      const { inputs, weights, logit } = oracle._getModelInputsWeightsAndLogit(
        actionId,
        context,
        features,
      );
      expect(inputs).toEqual(expectedModelInputs);
      expect(weights).toEqual(expectedWeights);
      expect(logit).toEqual(expectedLogit);
    });
  });

  describe("fromJSON", () => {
    it("should return an instance of LogisticOracle with the correct properties", () => {
      const newOracle = SimpleOracle.fromJSON(oracle.toJSON());
      expect(newOracle.actionIds).toEqual(actionIds);
      expect(newOracle.context).toEqual(context);
      expect(newOracle.features).toEqual(features);
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
        '{"actionIds":["action1","action2"],"context":["context1","context2"],"features":["feature1","feature2"],"learningRate":0.1,"actionIdFeatures":true,"actionFeatures":true,"contextActionIdInteractions":false,"contextActionFeatureInteractions":true,"useInversePropensityWeighting":false,"targetLabel":"click","name":"click","oracleWeight":1,"weights":{"intercept":0,"action1":0.1,"action2":0.2,"feature1":0.3,"feature2":0.4,"context1*feature1":1}}',
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
      const features = {
        feature1: 0,
        feature2: 0,
      };
      const actionId = "action3";
      expect(oracle.predict(actionId, context, features)).toEqual(0.5);
    });
    it("should return 0.73 for all features that add up to 1.3", () => {
      const context = {
        context1: 1,
        context2: 0,
      };
      const features = {
        feature1: 1,
        feature2: 0,
      };
      const actionId = "action3";
      expect(oracle.predict(actionId, context, features)).toBeCloseTo(0.785, 2);
    });
    it("should return 0.2689 for all features that add up to -1.3", () => {
      const context = {
        context1: 1,
        context2: 0,
      };
      const features = {
        feature1: -1,
        feature2: 0,
      };
      const actionId = "action3";
      expect(oracle.predict(actionId, context, features)).toBeCloseTo(0.214, 3);
    });
  });

  describe("fit", () => {
    it("should return an array of weights that are different from the previous weights", () => {
      const oracle = new SimpleOracle();
      const trainingData: ITrainingData = {
        recommendationId: "recommendation1",
        actionId: "action1",
        probability: 0.5,
        click: 1,
      };
      const oldWeights = { ...oracle.weights };
      oracle.fit(trainingData as any);
      expect(oracle.weights).not.toEqual(oldWeights);
      // 0 - sampleWeight * this.learningRate * (pred - y) * inputs[feature] = 1/0.5 * 1.0 * (0.5 - 1) * 1 = 1
      expect(oracle.weights["action1"]).toBeCloseTo(1, 2);
    });

    it("should return an array of weights that are different from the previous weights", () => {
      const oracle = new SimpleOracle();
      const trainingData: ITrainingData = {
        recommendationId: "recommendation1",
        actionId: "action1",
        probability: 0.5,
        context: { context1: 1 },
        features: { feature1: 1 },
        click: 1,
      };
      const oldWeights = { ...oracle.weights };
      oracle.fit(trainingData as any);
      expect(oracle.weights).not.toEqual(oldWeights);
      // 0 - sampleWeight * this.learningRate * (pred - y) * inputs[feature] = 1/0.5 * 1.0 * (0.5 - 1) * 1 = 1
      expect(oracle.weights["action1"]).toBeCloseTo(1, 2);
      expect(oracle.weights["context1*action1"]).toBeCloseTo(1, 2);
      expect(oracle.weights["context1*feature1"]).toBeCloseTo(1, 2);
      expect(oracle.weights["feature1"]).toBeCloseTo(1, 2);
    });

    it("should return an array of weights that are different from the previous weights", () => {
      const oracle = new SimpleOracle({
        weights: {
          intercept: 1,
          action1: 1,
          "context1*action1": 1,
          "context1*feature1": 1,
          feature1: 1,
        },
      });
      const trainingData: ITrainingData = {
        recommendationId: "recommendation1",
        actionId: "action1",
        probability: 0.5,
        context: { context1: 1 },
        features: { feature1: 1 },
        click: 1,
      };
      const oldWeights = { ...oracle.weights };
      oracle.fit(trainingData as any);
      expect(oracle.weights).not.toEqual(oldWeights);
      //pred = 1/(1+e^-(1+1+1+1+1)) = 0.993
      // 1 - sampleWeight * this.learningRate * (pred - y) * inputs[feature] = 1/0.5 * 1.0 * (0.993 - 1) * 1 = 1.0133
      expect(oracle.weights["action1"]).toBeCloseTo(1.0133, 3);
      expect(oracle.weights["context1*action1"]).toBeCloseTo(1.0133, 2);
      expect(oracle.weights["context1*feature1"]).toBeCloseTo(1.0133, 2);
      expect(oracle.weights["feature1"]).toBeCloseTo(1.0133, 2);
    });
  });
});
