import { SimpleOracle } from "../SimpleOracle";
import {
  ITrainingData,
  ISimpleOracleState,
  SimpleOracleOptions,
} from "../interfaces";

describe("SimpleOracle", () => {
  const context = ["context1", "context2"];
  const actionFeatures = ["feature1", "feature2"];
  const actionIds = ["action1", "action2"];
  const learningRate = 0.1;
  const contextActionIdInteractions = false;
  const contextActionFeatureInteractions = true;
  const useInversePropensityWeighting = false;
  const targetLabel = "label";
  const weights = {
    intercept: 0,
    action1: 0.1,
    action2: 0.2,
    feature1: 0.3,
    feature2: 0.4,
  };

  let oracle: SimpleOracle;

  it("should throw error if context is not an array", () => {
    expect(() => {
      new SimpleOracle({
        actionIds: actionIds,
        context: "context" as any,
        actionFeatures: actionFeatures,
        learningRate: learningRate,
        contextActionIdInteractions: contextActionIdInteractions,
        contextActionFeatureInteractions: contextActionFeatureInteractions,
        useInversePropensityWeighting: useInversePropensityWeighting,
        negativeClassWeight: 1.0,
        targetLabel: targetLabel,
        weights: weights,
      } as SimpleOracleOptions);
    }).toThrow("actionIds, context, actionFeatures must be arrays.");
  });

  it("should throw error if actionFeatures is not an array", () => {
    expect(() => {
      new SimpleOracle({
        actionIds: actionIds,
        context: context,
        actionFeatures: "actionFeatures" as any,
        learningRate: learningRate,
        contextActionIdInteractions: contextActionIdInteractions,
        contextActionFeatureInteractions: contextActionFeatureInteractions,
        useInversePropensityWeighting: useInversePropensityWeighting,
        negativeClassWeight: 1.0,
        targetLabel: targetLabel,
        weights: weights,
      } as SimpleOracleOptions);
    }).toThrow("actionIds, context, actionFeatures must be arrays.");
  });

  it("should throw error if actionIds is not an array", () => {
    expect(() => {
      new SimpleOracle({
        actionIds: "actionIds" as any,
        context: context,
        actionFeatures: actionFeatures,
        learningRate: learningRate,
        contextActionIdInteractions: contextActionIdInteractions,
        contextActionFeatureInteractions: contextActionFeatureInteractions,
        useInversePropensityWeighting: useInversePropensityWeighting,
        negativeClassWeight: 1.0,
        targetLabel: targetLabel,
        weights: weights,
      } as SimpleOracleOptions);
    }).toThrow("actionIds, context, actionFeatures must be arrays.");
  });

  it("should throw error if learningRate is not a number", () => {
    expect(() => {
      new SimpleOracle({
        actionIds: actionIds,
        context: context,
        actionFeatures: actionFeatures,
        learningRate: "learningRate" as any,
        contextActionIdInteractions: contextActionIdInteractions,
        contextActionFeatureInteractions: contextActionFeatureInteractions,
        useInversePropensityWeighting: useInversePropensityWeighting,
        negativeClassWeight: 1.0,
        targetLabel: targetLabel,
        weights: weights,
      } as SimpleOracleOptions);
    }).toThrow("Invalid argument: learningRate must be a positive number.");
  });

  it("should throw error if contextInteractions is not an array", () => {
    expect(() => {
      new SimpleOracle({
        actionIds: actionIds,
        context: context,
        actionFeatures: actionFeatures,
        learningRate: learningRate,
        contextActionIdInteractions: "contextActionIdInteractions" as any,
        contextActionFeatureInteractions: contextActionFeatureInteractions,
        useInversePropensityWeighting: useInversePropensityWeighting,
        negativeClassWeight: 1.0,
        targetLabel: targetLabel,
        weights: weights,
      } as SimpleOracleOptions);
    }).toThrow(
      "contextActionIdInteractions, contextActionFeatureInteractions, useInversePropensityWeighting must be booleans.",
    );
  });

  beforeEach(() => {
    oracle = new SimpleOracle({
      actionIds: actionIds,
      context: context,
      actionFeatures: actionFeatures,
      learningRate: learningRate,
      contextActionIdInteractions: contextActionIdInteractions,
      contextActionFeatureInteractions: contextActionFeatureInteractions,
      useInversePropensityWeighting: useInversePropensityWeighting,
      negativeClassWeight: 1.0,
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
      expect(oracle.weights).toEqual([0, 0.1, 0.2, 0.3, 0.4, 0, 0, 0, 0]);
    });
  });

  describe("getOracleState", () => {
    it("should return the correct state", () => {
      const expectedOracleState: ISimpleOracleState = {
        context,
        actionFeatures,
        actionIds: actionIds,
        learningRate,
        contextActionIdInteractions,
        contextActionFeatureInteractions,
        useInversePropensityWeighting,
        negativeClassWeight: 1.0,
        targetLabel,
        weights: {
          intercept: 0,
          "context1*feature1": 0,
          "context1*feature2": 0,
          "context2*feature1": 0,
          "context2*feature2": 0,
          action1: 0.1,
          action2: 0.2,
          feature1: 0.3,
          feature2: 0.4,
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
        contextActionIdInteractions,
        contextActionFeatureInteractions,
        useInversePropensityWeighting,
        negativeClassWeight: 1.0,
        targetLabel,
        weights: {
          intercept: 0,
          "context1*feature1": 0,
          "context1*feature2": 0,
          "context2*feature1": 0,
          "context2*feature2": 0,
          action1: 0.1,
          action2: 0.2,
          feature1: 0.3,
          feature2: 0.4,
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
      expect(newOracle.weights).toEqual([0, 0.1, 0.2, 0.3, 0.4, 0, 0, 0, 0]);
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
      expect(newOracle.weights).toEqual([0, 0.1, 0.2, 0.3, 0.4, 0, 0, 0, 0]);
    });
  });

  describe("getNFeatures", () => {
    it("should return the correct number of features", () => {
      expect(oracle._getNFeatures()).toEqual(9);
    });

    it("should return the correct number of features when addIntercept is false", () => {
      oracle.addIntercept = false;
      expect(oracle._getNFeatures()).toEqual(8);
    });
  });

  describe("getFeatures", () => {
    it("should return an array with all the features including interaction features", () => {
      expect(oracle._getFeatures()).toEqual([
        "action1",
        "action2",
        "feature1",
        "feature2",
        "context1*feature1",
        "context1*feature2",
        "context2*feature1",
        "context2*feature2",
      ]);
    });
  });

  describe("getInteractionFeatures", () => {
    it("should return an array with all the interaction features", () => {
      expect(oracle._getInteractionFeatures()).toEqual([
        "context1*feature1",
        "context1*feature2",
        "context2*feature1",
        "context2*feature2",
      ]);
    });
  });

  describe("zeroWeights", () => {
    it("should return an array of zeros with length equal to the specified input", () => {
      expect(oracle._zeroWeights(5)).toEqual([0, 0, 0, 0, 0]);
      expect(oracle._zeroWeights(0)).toEqual([]);
    });
  });

  describe("updateWeights", () => {
    it("should update the weights", () => {
      const newWeights = { action1: -0.1, action2: -0.2 };
      const updatedWeights = oracle._updateWeights(newWeights);
      expect(updatedWeights).toEqual([0, -0.1, -0.2, 0.3, 0.4, 0, 0, 0, 0]);
    });

    it("should update the weights when addIntercept is false", () => {
      oracle.addIntercept = false;
      const newWeights = { action1: -0.1, action2: -0.2 };
      const updatedWeights = oracle._updateWeights(newWeights);
      expect(updatedWeights).toEqual([-0.1, -0.2, 0.3, 0.4, 0, 0, 0, 0]);
    });
  });

  describe("setFeaturesAndUpdatedWeights", () => {
    it("should set the features and updated weights", () => {
      oracle.setFeaturesAndUpdateWeights(
        ["action1", "action2"],
        ["context1"],
        ["feature1", "feature2"],
      );
      expect(oracle.features).toEqual([
        "action1",
        "action2",
        "feature1",
        "feature2",
        "context1*feature1",
        "context1*feature2",
      ]);
    });
  });

  describe("getWeightsHash", () => {
    it("should return a hash of the weights", () => {
      expect(oracle.getWeightsHash()).toEqual({
        intercept: 0,
        action1: 0.1,
        action2: 0.2,
        feature1: 0.3,
        feature2: 0.4,
        "context1*feature1": 0,
        "context1*feature2": 0,
        "context2*feature1": 0,
        "context2*feature2": 0,
      });
    });
  });

  describe("getWeightsMap", () => {
    it("should return a hash of the weights", () => {
      expect(oracle.getWeightsMap()).toEqual(
        new Map([
          ["intercept", "0.000"],
          ["action1", "0.100"],
          ["action2", "0.200"],
          ["feature1", "0.300"],
          ["feature2", "0.400"],
          ["context1*feature1", "0.000"],
          ["context1*feature2", "0.000"],
          ["context2*feature1", "0.000"],
          ["context2*feature2", "0.000"],
        ]),
      );
    });
    it("should return a hash of the weights when addIntercept is false", () => {
      oracle.addIntercept = false;
      oracle._updateWeights(oracle.getWeightsHash());
      expect(oracle.getWeightsMap()).toEqual(
        new Map([
          ["action1", "0.100"],
          ["action2", "0.200"],
          ["feature1", "0.300"],
          ["feature2", "0.400"],
          ["context1*feature1", "0.000"],
          ["context1*feature2", "0.000"],
          ["context2*feature1", "0.000"],
          ["context2*feature2", "0.000"],
        ]),
      );
    });
  });

  describe("toJSON", () => {
    it("should return a JSON object with the correct properties", () => {
      expect(oracle.toJSON()).toEqual(
        '{"actionIds":["action1","action2"],"context":["context1","context2"],"actionFeatures":["feature1","feature2"],"learningRate":0.1,"contextActionIdInteractions":false,"contextActionFeatureInteractions":true,"useInversePropensityWeighting":false,"negativeClassWeight":1,"targetLabel":"label","weights":{"intercept":0,"action1":0.1,"action2":0.2,"feature1":0.3,"feature2":0.4,"context1*feature1":0,"context1*feature2":0,"context2*feature1":0,"context2*feature2":0}}',
      );
    });
  });

  describe("addActionIdFeatures", () => {
    it("should add the action name features to the features array", () => {
      const newInputsHash = oracle._addActionIdFeatures({}, "action1");
      expect(newInputsHash).toEqual({ action1: 1, action2: 0 });
    });
    it("should not add the action name features to the features array if no action name is passed", () => {
      const newInputsHash = oracle._addActionIdFeatures({});
      expect(newInputsHash).toEqual({ action1: 0, action2: 0 });
    });
    it("should not add the action name features to the features array if the action name is not in the actionIds array", () => {
      const newInputsHash = oracle._addActionIdFeatures({}, "action3");
      expect(newInputsHash).toEqual({ action1: 0, action2: 0 });
    });
  });

  describe("hashContainsAllKeys", () => {
    it("should return true if the hash contains all the keys", () => {
      const hash = { action1: 1, action2: 0 };
      expect(oracle._hashContainsAllKeys(hash, ["action1", "action2"])).toEqual(
        true,
      );
    });

    it("should return true if the hash contains all the keys or more", () => {
      const hash = { action1: 1, action2: 0, action3: 1 };
      expect(oracle._hashContainsAllKeys(hash, ["action1", "action2"])).toEqual(
        true,
      );
    });

    it("should return false if the hash does not contain all the keys", () => {
      const hash = { action1: 1 };
      expect(oracle._hashContainsAllKeys(hash, ["action1", "action2"])).toEqual(
        false,
      );
    });
    it("should return false if the hash is empty", () => {
      const hash = {};
      expect(oracle._hashContainsAllKeys(hash, ["action1", "action2"])).toEqual(
        false,
      );
    });
  });

  describe("addInteractionFeatures", () => {
    it("should return an hash of interaction features", () => {
      oracle.setFeaturesAndUpdateWeights(
        undefined, // context
        undefined, // actionFeatures
        undefined, // actionIds
        true, // contextActionInteractions
        true, // contextActionFeatureInteractions
      );
      const hash = {
        context1: 1,
        context2: 0,
        action1: 1,
        action2: 0,
        feature1: 1,
        feature2: 0,
      };

      expect(oracle._addInteractionFeatures(hash)).toEqual({
        context1: 1,
        context2: 0,
        action1: 1,
        action2: 0,
        feature1: 1,
        feature2: 0,
        "context1*feature1": 1,
        "context1*feature2": 0,
        "context2*feature1": 0,
        "context2*feature2": 0,
        "context1*action1": 1,
        "context1*action2": 0,
        "context2*action1": 0,
        "context2*action2": 0,
      });
    });
  });

  describe("getOrderedInputsArray", () => {
    let context: Record<string, number>;
    let actionFeatures: Record<string, number>;

    beforeEach(() => {
      context = {
        context1: 1,
        context2: 0,
      };
      actionFeatures = {
        feature1: 1,
        feature2: 0,
      };
    });

    it("should return an array of inputs in the correct order with only action interactions", () => {
      oracle.setFeaturesAndUpdateWeights(
        undefined,
        undefined,
        undefined,
        true,
        false,
      );

      const actionId = "action1";
      expect(
        oracle._getOrderedInputsArray(actionId, context, actionFeatures),
      ).toEqual([1, 1, 0, 1, 0, 1, 0, 0, 0]);
    });

    it("should return an array of inputs in the correct order with only feature interactions", () => {
      oracle.setFeaturesAndUpdateWeights(
        undefined,
        undefined,
        undefined,
        true,
        true,
      );
      const actionId = "action1";
      expect(
        oracle._getOrderedInputsArray(actionId, context, actionFeatures),
      ).toEqual([1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0]);
    });

    it("should return an array of inputs in the correct order with both action and feature interactions", () => {
      oracle.setFeaturesAndUpdateWeights(
        undefined, // context
        undefined, // actionFeatures
        undefined, // actionIds
        true, // useFeatureInteractions
        true, // useActionInteractions
      );
      const actionId = "action1";
      expect(
        oracle._getOrderedInputsArray(actionId, context, actionFeatures),
      ).toEqual([1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0]);
    });

    it("should return an array of inputs in the correct order with no interactions", () => {
      oracle.setFeaturesAndUpdateWeights(
        undefined,
        undefined,
        undefined,
        undefined,
        false,
      );
      const actionId = "action1";
      expect(
        oracle._getOrderedInputsArray(actionId, context, actionFeatures),
      ).toEqual([1, 1, 0, 1, 0]);
    });

    it("should return an array of inputs in the correct order with only feature interactions with action2", () => {
      oracle.setFeaturesAndUpdateWeights(
        undefined,
        undefined,
        undefined,
        true,
        true,
      );
      const actionId = "action2";
      expect(
        oracle._getOrderedInputsArray(actionId, context, actionFeatures),
      ).toEqual([1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0]);
    });

    it("it should throw an error if there is a missing features", () => {
      oracle.setFeaturesAndUpdateWeights(
        undefined,
        undefined,
        undefined,
        true,
        true,
      );
      const actionId = "action2";
      delete context.context1;
      expect(() =>
        oracle._getOrderedInputsArray(actionId, context, actionFeatures),
      ).toThrow("Missing features in inputsHash: ");
    });
  });

  describe("sigmoid", () => {
    it("should return 0.5 for 0", () => {
      expect(oracle._sigmoid(0)).toEqual(0.5);
    });
    it("should return 0.7310585786300049 for 1", () => {
      expect(oracle._sigmoid(1)).toEqual(0.7310585786300049);
    });
    it("should return 0.2689414213699951 for -1", () => {
      expect(oracle._sigmoid(-1)).toEqual(0.2689414213699951);
    });
  });

  describe("predict", () => {
    beforeEach(() => {
      oracle.setFeaturesAndUpdateWeights(
        undefined,
        undefined,
        undefined,
        true,
        true,
        { feature1: 0, "context1*feature1": 1, "context1*action1": 1 },
      );
    });
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
      expect(oracle._predictLogit(actionId, context, actionFeatures)).toEqual(
        1,
      );
      expect(oracle.predict(actionId, context, actionFeatures)).toEqual(
        0.7310585786300049,
      );
    });

    it("should return 0.73 for all features that add up to 1", () => {
      const context = {
        context1: 1,
        context2: 0,
      };
      const actionFeatures = {
        feature1: -1,
        feature2: 0,
      };
      const actionId = "action3";
      expect(oracle._predictLogit(actionId, context, actionFeatures)).toEqual(
        -1,
      );
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
        label: 1,
        probability: 0.5,
      };
      const oldWeights = oracle.weights.slice();
      oracle.fit(trainingData as any);
      expect(oracle.weights).not.toEqual(oldWeights);

      const newWeights = oracle.getWeightsHash();
      expect(newWeights["action1"]).toBeCloseTo(0.14, 2);
    });
  });

  describe("fitMany", () => {
    it("should update weights after passing training data", () => {
      let trainingData: ITrainingData[] = [
        {
          actionId: "action1",
          context: { context1: 1, context2: 0 },
          actionFeatures: { feature1: 1, feature2: 0 },
          label: 1,
          probability: 0.5,
        },
        {
          actionId: "action1",
          context: { context1: 1, context2: 0 },
          actionFeatures: { feature1: 1, feature2: 0 },
          label: 1,
          probability: 0.5,
        },
      ];

      const oldWeights = oracle.weights.slice();
      oracle.fitMany(trainingData as any);
      expect(oracle.weights).not.toEqual(oldWeights);

      const newWeights = oracle.getWeightsHash();
      expect(newWeights["action1"]).toBeCloseTo(0.18, 2);
    });
  });
});
