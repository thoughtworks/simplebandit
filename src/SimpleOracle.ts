import {
  ISimpleOracleState,
  ISimpleOracle,
  WeightsHash,
  ITrainingData,
} from "./interfaces/index";

export interface SimpleOracleOptions {
  actionIds?: string[];
  context?: string[];
  features?: string[];
  learningRate?: number;
  regularizer?: number;
  actionIdFeatures?: boolean;
  actionFeatures?: boolean;
  contextActionIdInteractions?: boolean;
  contextActionFeatureInteractions?: boolean;
  useInversePropensityWeighting?: boolean;
  laplaceSmoothing?: number;
  targetLabel?: string;
  name?: string;
  oracleWeight?: number;
  weights?: WeightsHash;
}

export class SimpleOracle implements ISimpleOracle {
  actionIds?: string[];
  context?: string[];
  features?: string[];
  addIntercept!: boolean;
  learningRate: number;
  regularizer!: number;
  actionIdFeatures!: boolean;
  actionFeatures!: boolean;
  contextActionIdInteractions!: boolean;
  contextActionFeatureInteractions!: boolean;
  useInversePropensityWeighting: boolean;
  laplaceSmoothing!: number;
  targetLabel: string;
  name: string;
  oracleWeight: number;
  weights!: { [feature: string]: number };

  public constructor({
    actionIds = undefined,
    context = undefined,
    features = undefined,
    learningRate = 0.1,
    regularizer = 0.0,
    actionIdFeatures = true,
    actionFeatures = true,
    contextActionIdInteractions = true,
    contextActionFeatureInteractions = true,
    useInversePropensityWeighting = true,
    laplaceSmoothing = 0.01,
    targetLabel = "click",
    name = undefined,
    oracleWeight = 1.0,
    weights = {},
  }: SimpleOracleOptions = {}) {
    if (
      (actionIds !== undefined &&
        !(
          Array.isArray(actionIds) &&
          actionIds.every((item) => typeof item === "string")
        )) ||
      (context !== undefined &&
        !(
          Array.isArray(context) &&
          context.every((item) => typeof item === "string")
        )) ||
      (features !== undefined &&
        !(
          Array.isArray(features) &&
          features.every((item) => typeof item === "string")
        ))
    ) {
      throw new Error(
        "actionIds, context, features must be arrays of strings or undefined.",
      );
    }

    if (typeof learningRate !== "number" || learningRate <= 0) {
      throw new Error(
        "Invalid argument: learningRate must be a positive number.",
      );
    }
    if (typeof regularizer !== "number" || regularizer < 0) {
      throw new Error(
        "Invalid argument: regularizer must be a positive number.",
      );
    }
    if (typeof laplaceSmoothing !== "number" || laplaceSmoothing < 0) {
      throw new Error(
        "Invalid argument: laplaceSmoothing must be a positive number.",
      );
    }

    if (
      typeof actionIdFeatures !== "boolean" ||
      typeof actionFeatures !== "boolean" ||
      typeof contextActionIdInteractions !== "boolean" ||
      typeof contextActionFeatureInteractions !== "boolean" ||
      typeof useInversePropensityWeighting !== "boolean"
    ) {
      throw new Error(
        "actionIdFeatures, actionFeatures, contextActionIdInteractions, contextActionFeatureInteractions, useInversePropensityWeighting must be booleans.",
      );
    }

    this.actionIds = actionIds;
    this.context = context;
    this.features = features;

    this.addIntercept = true;
    this.actionIdFeatures = actionIdFeatures;
    this.actionFeatures = actionFeatures;
    this.contextActionIdInteractions = contextActionIdInteractions;
    this.contextActionFeatureInteractions = contextActionFeatureInteractions;

    this.targetLabel = targetLabel;
    this.learningRate = learningRate;
    this.regularizer = regularizer;
    this.laplaceSmoothing = laplaceSmoothing;
    this.useInversePropensityWeighting = useInversePropensityWeighting;

    this.name = name || targetLabel;
    this.oracleWeight = oracleWeight;

    this.weights = weights;
  }

  public getOracleState(): ISimpleOracleState {
    return {
      actionIds: this.actionIds,
      context: this.context,
      features: this.features,
      learningRate: this.learningRate,
      regularizer: this.regularizer,
      actionIdFeatures: this.actionIdFeatures,
      actionFeatures: this.actionFeatures,
      contextActionIdInteractions: this.contextActionIdInteractions,
      contextActionFeatureInteractions: this.contextActionFeatureInteractions,
      useInversePropensityWeighting: this.useInversePropensityWeighting,
      laplaceSmoothing: this.laplaceSmoothing,
      targetLabel: this.targetLabel,
      name: this.name,
      oracleWeight: this.oracleWeight,
      weights: this.weights,
    };
  }

  public static fromOracleState(oracleState: ISimpleOracleState): SimpleOracle {
    return new SimpleOracle({
      actionIds: oracleState.actionIds,
      context: oracleState.context,
      features: oracleState.features,
      learningRate: oracleState.learningRate,
      regularizer: oracleState.regularizer,
      actionIdFeatures: oracleState.actionIdFeatures,
      actionFeatures: oracleState.actionFeatures,
      contextActionIdInteractions: oracleState.contextActionIdInteractions,
      contextActionFeatureInteractions:
        oracleState.contextActionFeatureInteractions,
      useInversePropensityWeighting: oracleState.useInversePropensityWeighting,
      laplaceSmoothing: oracleState.laplaceSmoothing,
      targetLabel: oracleState.targetLabel,
      name: oracleState.name,
      oracleWeight: oracleState.oracleWeight,
      weights: oracleState.weights,
    } as SimpleOracleOptions);
  }

  public toJSON(): string {
    return JSON.stringify(this.getOracleState());
  }

  public static fromJSON(json: string): SimpleOracle {
    const oracleState = JSON.parse(json);
    return SimpleOracle.fromOracleState(oracleState);
  }

  _sigmoid(z: number) {
    return 1 / (1 + Math.exp(-z));
  }

  _getModelInputsWeightsAndLogit(
    actionId: string,
    context: { [feature: string]: number } = {},
    features: { [feature: string]: number } = {},
  ): {
    inputs: { [feature: string]: number };
    weights: { [feature: string]: number };
    logit: number;
  } {
    const inputs: { [feature: string]: number } = {};
    const weights: { [feature: string]: number } = {};
    let logit = 0;

    if (this.addIntercept) {
      weights["intercept"] = this.weights["intercept"] || 0;
      inputs["intercept"] = 1;
      logit += weights["intercept"] * inputs["intercept"];
    }

    if (this.actionIdFeatures) {
      weights[actionId] = this.weights[actionId] || 0;
      inputs[actionId] = 1;
      logit += inputs[actionId] * weights[actionId];
    }

    if (this.actionFeatures) {
      for (const feature in features) {
        if (!this.features || this.features.includes(feature)) {
          if (features[feature] > 1 || features[feature] < -1) {
            throw new Error(
              "Feature values must be between -1 and 1! But got features=`${features}`",
            );
          }
          weights[feature] = this.weights[feature] || 0;
          inputs[feature] = features[feature];
          logit += weights[feature] * inputs[feature];
        }
      }
    }

    if (this.contextActionIdInteractions) {
      for (const contextFeature in context) {
        if (!this.context || this.context.includes(contextFeature)) {
          const interactionFeature = `${contextFeature}*${actionId}`;
          weights[interactionFeature] = this.weights[interactionFeature] || 0;
          inputs[interactionFeature] = context[contextFeature];
          logit += weights[interactionFeature] * inputs[interactionFeature];
        }
      }
    }

    if (this.contextActionFeatureInteractions) {
      for (const actionFeature in features) {
        if (!this.features || this.features.includes(actionFeature)) {
          for (const contextFeature in context) {
            if (!this.context || this.context.includes(contextFeature)) {
              if (
                context[contextFeature] > 1 ||
                context[contextFeature] < -1 ||
                features[actionFeature] > 1 ||
                features[actionFeature] < -1
              ) {
                throw new Error(
                  "Context and feature values must be between -1 and 1! But got context=`${context}` and features=`${features}`",
                );
              }
              const interactionFeature = `${contextFeature}*${actionFeature}`;
              weights[interactionFeature] =
                this.weights[interactionFeature] || 0;
              inputs[interactionFeature] =
                context[contextFeature] * features[actionFeature];
              logit += weights[interactionFeature] * inputs[interactionFeature];
            }
          }
        }
      }
    }
    return { inputs: inputs, weights: weights, logit: logit };
  }

  predict(
    actionId: string,
    context: { [feature: string]: number } = {},
    features: { [feature: string]: number } = {},
  ): number {
    const processedInput = this._getModelInputsWeightsAndLogit(
      actionId,
      context,
      features,
    );
    return this._sigmoid(processedInput["logit"]);
  }

  fit(trainingData: ITrainingData | ITrainingData[]): void {
    if (!Array.isArray(trainingData)) {
      trainingData = [trainingData];
    }
    for (const data of trainingData) {
      if (data[this.targetLabel as keyof ITrainingData] !== undefined) {
        const processedInput = this._getModelInputsWeightsAndLogit(
          data.actionId,
          data.context ?? {},
          data.features ?? {},
        );
        const y = (data as any)[this.targetLabel];
        if (y > 1 || y < 0) {
          throw new Error(
            "Target label must be between 0 and 1! But got `${this.targetLabel}`=`${y}`",
          );
        }
        let sampleWeight =
          data.sampleWeight !== undefined ? data.sampleWeight : 1.0;
        if (this.useInversePropensityWeighting && data.probability > 0) {
          sampleWeight *= 1 / (this.laplaceSmoothing + data.probability);
        }

        const pred = this._sigmoid(processedInput["logit"]);
        const grad = sampleWeight * this.learningRate * (pred - y);
        const reg = this.regularizer * this.learningRate;

        for (const feature in processedInput.inputs) {
          this.weights[feature] =
            processedInput.weights[feature] -
            grad * processedInput.inputs[feature] -
            reg * processedInput.weights[feature];
        }
      } else {
        // silently ignore training data without targetLabel: not meant for this oracle
      }
    }
  }
}
