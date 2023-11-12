import {
  ISimpleOracleState,
  ISimpleOracle,
  WeightsHash,
  ITrainingData,
} from "./interfaces";

const DEFAULT_PROBABILITY: number = 0.1;
const DEFAULT_LEARNING_RATE: number = 0.5;

export type WeightedOracle = { oracle: SimpleOracle; weight: number };

export interface SimpleOracleOptions {
  actionIds?: string[];
  context?: string[];
  actionFeatures?: string[];
  learningRate?: number;
  actionIdFeatures?: boolean;
  contextActionIdInteractions?: boolean;
  contextActionFeatureInteractions?: boolean;
  useInversePropensityWeighting?: boolean;
  targetLabel?: string;
  name?: string;
  oracleWeight?: number;
  weights?: WeightsHash;
}

export class SimpleOracle implements ISimpleOracle {
  actionIds?: string[];
  context?: string[];
  actionFeatures?: string[];
  addIntercept!: boolean;
  learningRate: number;
  actionIdFeatures!: boolean;
  contextActionIdInteractions!: boolean;
  contextActionFeatureInteractions!: boolean;
  useInversePropensityWeighting: boolean;
  targetLabel: string;
  name: string;
  oracleWeight: number;
  weights!: { [feature: string]: number };

  public constructor({
    actionIds = undefined,
    context = undefined,
    actionFeatures = undefined,
    learningRate = DEFAULT_LEARNING_RATE, // example default value
    actionIdFeatures = true,
    contextActionIdInteractions = true,
    contextActionFeatureInteractions = true,
    useInversePropensityWeighting = true,
    targetLabel = "click",
    name = "click",
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
      (actionFeatures !== undefined &&
        !(
          Array.isArray(actionFeatures) &&
          actionFeatures.every((item) => typeof item === "string")
        ))
    ) {
      throw new Error(
        "actionIds, context, actionFeatures must be arrays of strings or undefined.",
      );
    }

    if (typeof learningRate !== "number" || learningRate <= 0) {
      throw new Error(
        "Invalid argument: learningRate must be a positive number.",
      );
    }

    if (
      typeof actionIdFeatures !== "boolean" ||
      typeof contextActionIdInteractions !== "boolean" ||
      typeof contextActionFeatureInteractions !== "boolean" ||
      typeof useInversePropensityWeighting !== "boolean"
    ) {
      throw new Error(
        "actionIdFeatures, contextActionIdInteractions, contextActionFeatureInteractions, useInversePropensityWeighting must be booleans.",
      );
    }

    this.actionIds = actionIds;
    this.context = context;
    this.actionFeatures = actionFeatures;

    this.addIntercept = true;
    this.actionIdFeatures = actionIdFeatures;
    this.contextActionIdInteractions = contextActionIdInteractions;
    this.contextActionFeatureInteractions = contextActionFeatureInteractions;

    this.targetLabel = targetLabel;
    this.learningRate = learningRate;
    this.useInversePropensityWeighting = useInversePropensityWeighting;

    this.name = name;
    this.oracleWeight = oracleWeight;

    this.weights = weights;
  }

  public getOracleState(): ISimpleOracleState {
    return {
      actionIds: this.actionIds,
      context: this.context,
      actionFeatures: this.actionFeatures,
      learningRate: this.learningRate,
      actionIdFeatures: this.actionIdFeatures,
      contextActionIdInteractions: this.contextActionIdInteractions,
      contextActionFeatureInteractions: this.contextActionFeatureInteractions,
      useInversePropensityWeighting: this.useInversePropensityWeighting,
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
      actionFeatures: oracleState.actionFeatures,
      learningRate: oracleState.learningRate,
      actionIdFeatures: oracleState.actionIdFeatures,
      contextActionIdInteractions: oracleState.contextActionIdInteractions,
      contextActionFeatureInteractions:
        oracleState.contextActionFeatureInteractions,
      useInversePropensityWeighting: oracleState.useInversePropensityWeighting,
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
    let oracleState = JSON.parse(json);
    return SimpleOracle.fromOracleState(oracleState);
  }

  _sigmoid(z: number) {
    return 1 / (1 + Math.exp(-z));
  }

  _getModelInputsWeightsAndLogit(
    actionId: string,
    contextInputs: { [feature: string]: number } = {},
    actionInputs: { [feature: string]: number } = {},
  ): {
    inputs: { [feature: string]: number };
    weights: { [feature: string]: number };
    logit: number;
  } {
    let inputs: { [feature: string]: number } = {};
    let weights: { [feature: string]: number } = {};
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

    if (this.contextActionIdInteractions) {
      for (let contextFeature in contextInputs) {
        if (!this.context || this.context.includes(contextFeature)) {
          let interactionFeature = `${contextFeature}*${actionId}`;
          weights[interactionFeature] = this.weights[interactionFeature] || 0;
          inputs[interactionFeature] = contextInputs[contextFeature];
          logit += weights[interactionFeature] * inputs[interactionFeature];
        }
      }
    }

    if (this.contextActionFeatureInteractions) {
      for (let actionFeature in actionInputs) {
        if (
          !this.actionFeatures ||
          this.actionFeatures.includes(actionFeature)
        ) {
          for (let contextFeature in contextInputs) {
            if (!this.context || this.context.includes(contextFeature)) {
              let interactionFeature = `${contextFeature}*${actionFeature}`;
              weights[interactionFeature] =
                this.weights[interactionFeature] || 0;
              inputs[interactionFeature] =
                contextInputs[contextFeature] * actionInputs[actionFeature];
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
    contextInputs: { [feature: string]: number } = {},
    actionInputs: { [feature: string]: number } = {},
  ): number {
    const processedInput = this._getModelInputsWeightsAndLogit(
      actionId,
      contextInputs,
      actionInputs,
    );
    return this._sigmoid(processedInput["logit"]);
  }

  fit(trainingData: ITrainingData | ITrainingData[]): void {
    if (!Array.isArray(trainingData)) {
      trainingData = [trainingData];
    }
    for (let data of trainingData) {
      if (data[this.targetLabel as keyof ITrainingData] !== undefined) {
        const processedInput = this._getModelInputsWeightsAndLogit(
          data.actionId,
          data.contextInputs ?? {},
          data.actionInputs ?? {},
        );
        const y = (data as any)[this.targetLabel];
        let sampleWeight = 1;
        if (this.useInversePropensityWeighting) {
          sampleWeight = 1 / (data.probability ?? DEFAULT_PROBABILITY);
        }

        const pred = this._sigmoid(processedInput["logit"]);
        const grad = sampleWeight * this.learningRate * (pred - y);

        for (let feature in processedInput.inputs) {
          this.weights[feature] =
            processedInput.weights[feature] -
            grad * processedInput.inputs[feature];
        }
      } else {
        // silently ignore training data without target label:
        // not meant for this oracle
      }
    }
  }
}
