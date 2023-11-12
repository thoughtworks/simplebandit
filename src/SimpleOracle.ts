import {
  SimpleOracleOptions,
  ISimpleOracleState,
  ISimpleOracle,
  WeightsHash,
  FeaturesHash,
  ITrainingData,
} from "./interfaces";

const DEFAULT_PROBABILITY: number = 0.1;
const DEFAULT_LEARNING_RATE: number = 0.5;
const DEFAULT_NEGATIVE_CLASS_WEIGHT: number = 1.0;

export type WeightedOracle = { oracle: SimpleOracle; weight: number };

export class SimpleOracle implements ISimpleOracle {
  actionIds!: string[];
  context!: string[];
  actionFeatures!: string[];
  addIntercept!: boolean;
  learningRate: number;
  contextActionIdInteractions!: boolean;
  contextActionFeatureInteractions!: boolean;
  useInversePropensityWeighting: boolean;
  negativeClassWeight: number;
  targetLabel: string;
  strictFeatures: boolean;
  name: string;
  oracleWeight: number;
  weights!: number[];

  allInputFeatures!: string[];
  interactionFeatures!: string[];
  features!: string[];
  nFeatures!: number;

  public constructor({
    actionIds = [],
    context = [],
    actionFeatures = [],
    learningRate = DEFAULT_LEARNING_RATE, // example default value
    contextActionIdInteractions = true,
    contextActionFeatureInteractions = true,
    useInversePropensityWeighting = true,
    negativeClassWeight = DEFAULT_NEGATIVE_CLASS_WEIGHT,
    targetLabel = "click",
    strictFeatures = true,
    name = "click",
    oracleWeight = 1.0,
    weights = {},
  }: SimpleOracleOptions = {}) {
    if (
      !Array.isArray(actionIds) ||
      !Array.isArray(context) ||
      !Array.isArray(actionFeatures)
    ) {
      throw new Error("actionIds, context, actionFeatures must be arrays.");
    }

    if (typeof learningRate !== "number" || learningRate <= 0) {
      throw new Error(
        "Invalid argument: learningRate must be a positive number.",
      );
    }

    if (
      typeof contextActionIdInteractions !== "boolean" ||
      typeof contextActionFeatureInteractions !== "boolean" ||
      typeof useInversePropensityWeighting !== "boolean" ||
      typeof strictFeatures !== "boolean"
    ) {
      throw new Error(
        "contextActionIdInteractions, contextActionFeatureInteractions, useInversePropensityWeighting, strictFeatures must be booleans.",
      );
    }
    this.addIntercept = true;
    this.setFeaturesAndUpdateWeights(
      actionIds,
      context,
      actionFeatures,
      contextActionIdInteractions,
      contextActionFeatureInteractions,
      weights,
    );
    this.targetLabel = targetLabel;
    this.learningRate = learningRate;
    this.useInversePropensityWeighting = useInversePropensityWeighting;
    this.negativeClassWeight = negativeClassWeight;
    this.strictFeatures = strictFeatures;
    this.name = name;
    this.oracleWeight = oracleWeight;
  }

  public getOracleState(): ISimpleOracleState {
    return {
      actionIds: this.actionIds,
      context: this.context,
      actionFeatures: this.actionFeatures,
      learningRate: this.learningRate,
      contextActionIdInteractions: this.contextActionIdInteractions,
      contextActionFeatureInteractions: this.contextActionFeatureInteractions,
      useInversePropensityWeighting: this.useInversePropensityWeighting,
      negativeClassWeight: this.negativeClassWeight,
      targetLabel: this.targetLabel,
      strictFeatures: this.strictFeatures,
      name: this.name,
      oracleWeight: this.oracleWeight,
      weights: this.getWeightsHash(),
    };
  }

  public static fromOracleState(oracleState: ISimpleOracleState): SimpleOracle {
    return new SimpleOracle({
      actionIds: oracleState.actionIds,
      context: oracleState.context,
      actionFeatures: oracleState.actionFeatures,
      learningRate: oracleState.learningRate,
      contextActionIdInteractions: oracleState.contextActionIdInteractions,
      contextActionFeatureInteractions:
        oracleState.contextActionFeatureInteractions,
      useInversePropensityWeighting: oracleState.useInversePropensityWeighting,
      negativeClassWeight: oracleState.negativeClassWeight,
      targetLabel: oracleState.targetLabel,
      strictFeatures: oracleState.strictFeatures,
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

  _getFeatures(): string[] {
    let features = [
      ...this.actionIds,
      ...this.actionFeatures,
      ...this.interactionFeatures,
    ];
    return features;
  }

  _getInteractionFeatures(): string[] {
    let interactionFeatures: string[] = [];
    if (this.contextActionIdInteractions) {
      for (let i = 0; i < this.context.length; i++) {
        for (let j = 0; j < this.actionIds.length; j++) {
          interactionFeatures.push(this.context[i] + "*" + this.actionIds[j]);
        }
      }
    }
    if (this.contextActionFeatureInteractions) {
      for (let i = 0; i < this.context.length; i++) {
        for (let j = 0; j < this.actionFeatures.length; j++) {
          interactionFeatures.push(
            this.context[i] + "*" + this.actionFeatures[j],
          );
        }
      }
    }
    return interactionFeatures;
  }

  _getNFeatures(): number {
    if (this.addIntercept) {
      return this.features.length + 1;
    } else {
      return this.features.length;
    }
  }

  _zeroWeights(nFeatures: number): number[] {
    return Array(nFeatures).fill(0);
  }

  _updateWeights(newWeights: WeightsHash = {}): number[] {
    const combinedWeights: WeightsHash = Object.assign(
      {},
      this.getWeightsHash(),
      newWeights,
    );
    this.weights = this._zeroWeights(this._getNFeatures());
    let offset = this.addIntercept ? 1 : 0;
    if (this.addIntercept) {
      this.weights[0] = combinedWeights["intercept"] ?? this.weights[0];
    }
    for (let i = 0; i < this.features.length; i++) {
      const feature = this.features[i];
      this.weights[i + offset] =
        combinedWeights[feature] ?? this.weights[i + offset];
    }

    return this.weights;
  }

  public setFeaturesAndUpdateWeights(
    actionIds?: string[],
    context?: string[],
    actionFeatures?: string[],
    contextActionIdInteractions?: boolean,
    contextActionFeatureInteractions?: boolean,
    weights: WeightsHash = {},
  ): void {
    this.actionIds = actionIds ?? this.actionIds;
    this.context = context ?? this.context;
    this.actionFeatures = actionFeatures ?? this.actionFeatures;

    this.contextActionIdInteractions =
      contextActionIdInteractions ?? this.contextActionIdInteractions;
    this.contextActionFeatureInteractions =
      contextActionFeatureInteractions ?? this.contextActionFeatureInteractions;

    this.allInputFeatures = [...this.context, ...this.actionFeatures];
    this.interactionFeatures = this._getInteractionFeatures();
    this.features = this._getFeatures();
    this.nFeatures = this._getNFeatures();
    this.weights = this._updateWeights(weights);
  }

  public getWeightsHash(): WeightsHash {
    let result: WeightsHash = {};
    if (this.weights == undefined) {
      return result;
    }
    if (this.addIntercept) {
      result["intercept"] = this.weights[0];
    }
    if (this.features !== undefined) {
      this.features.forEach((key: string, i: number) => {
        result[key] = this.weights[i + 1];
      });
    }
    return result;
  }

  public getWeightsMap(round: number = 3): Map<string, string> {
    const result = new Map<string, string>();
    if (this.addIntercept) {
      result.set("intercept", Number(this.weights[0]).toFixed(round));
      this.features.forEach((key: string, i: number) => {
        result.set(key, Number(this.weights[i + 1]).toFixed(round));
      });
    } else {
      this.features.forEach((key: string, i: number) => {
        result.set(key, Number(this.weights[i]).toFixed(round));
      });
    }
    return result;
  }

  _hashContainsAllKeys(hash: FeaturesHash, keys: string[]): boolean {
    for (let i = 0; i < keys.length; i++) {
      if (!hash.hasOwnProperty(keys[i])) {
        return false;
      }
    }
    return true;
  }

  _addActionIdFeatures(
    inputsHash: FeaturesHash,
    actionId: string | undefined = undefined,
  ): Record<string, number> {
    for (let i = 0; i < this.actionIds.length; i++) {
      if (this.actionIds[i] === actionId) {
        inputsHash[this.actionIds[i]] = 1;
      } else {
        inputsHash[this.actionIds[i]] = 0;
      }
    }
    return inputsHash;
  }

  _addInteractionFeatures(inputsHash: FeaturesHash): FeaturesHash {
    if (this.contextActionIdInteractions) {
      for (let i = 0; i < this.context.length; i++) {
        for (let j = 0; j < this.actionIds.length; j++) {
          inputsHash[this.context[i] + "*" + this.actionIds[j]] =
            inputsHash[this.context[i]] * inputsHash[this.actionIds[j]];
        }
      }
    }
    if (this.contextActionFeatureInteractions) {
      for (let i = 0; i < this.context.length; i++) {
        for (let j = 0; j < this.actionFeatures.length; j++) {
          inputsHash[this.context[i] + "*" + this.actionFeatures[j]] =
            inputsHash[this.context[i]] * inputsHash[this.actionFeatures[j]];
        }
      }
    }
    return inputsHash;
  }

  _getOrderedInputsArray(
    actionId: string,
    context: FeaturesHash = {},
    actionFeatures: FeaturesHash = {},
  ): number[] {
    let inputsHash: FeaturesHash = { ...context, ...actionFeatures };
    if (!this._hashContainsAllKeys(inputsHash, this.allInputFeatures)) {
      // throw error with missing features:
      const missingFeatures: string[] = [];
      this.allInputFeatures.forEach((feature) => {
        if (!inputsHash.hasOwnProperty(feature)) {
          missingFeatures.push(feature);
        }
      });
      if (this.strictFeatures) {
        throw new Error(`Missing features in inputsHash: ${missingFeatures}`);
      } else {
        // add missing features with value 0:
        missingFeatures.forEach((feature) => {
          inputsHash[feature] = 0;
        });
      }
    }
    inputsHash = this._addActionIdFeatures(inputsHash, actionId);
    inputsHash = this._addInteractionFeatures(inputsHash);

    const inputsArray: number[] = [];
    if (this.addIntercept) {
      inputsArray.push(1);
    }
    for (const feature of this.features) {
      inputsArray.push(inputsHash[feature]);
    }
    return inputsArray;
  }

  _sigmoid(z: number) {
    return 1 / (1 + Math.exp(-z));
  }

  _predictLogit(
    actionId: string,
    contextInputs: FeaturesHash = {},
    actionInputs: FeaturesHash = {},
  ): number {
    const X = this._getOrderedInputsArray(
      actionId,
      contextInputs,
      actionInputs,
    );
    let logit = 0;
    for (let i = 0; i < X.length; i++) {
      logit += X[i] * this.weights[i];
    }
    return logit;
  }

  predict(
    actionId: string,
    contextInputs: FeaturesHash = {},
    actionInputs: FeaturesHash = {},
  ): number {
    const logit = this._predictLogit(actionId, contextInputs, actionInputs);
    const proba = this._sigmoid(logit);
    return proba;
  }

  fit(trainingData: ITrainingData): void {
    if (trainingData[this.targetLabel as keyof ITrainingData] !== undefined) {
      const X = this._getOrderedInputsArray(
        trainingData.actionId,
        trainingData.context ?? {},
        trainingData.actionFeatures ?? {},
      );
      const y = (trainingData as any)[this.targetLabel];
      let sampleWeight = 1;
      if (this.useInversePropensityWeighting) {
        sampleWeight = 1 / (trainingData.probability ?? DEFAULT_PROBABILITY);
      }
      if (y == 0) {
        sampleWeight = sampleWeight * this.negativeClassWeight;
      }

      const pred = this._sigmoid(
        this._predictLogit(
          trainingData.actionId,
          trainingData.context,
          trainingData.actionFeatures,
        ),
      );

      for (let i = 0; i < this.weights.length; i++) {
        const gradient = sampleWeight * this.learningRate * ((pred - y) * X[i]);
        this.weights[i] -= gradient;
      }
    } else {
      // Handle missing or incorrect target label
    }
  }

  fitMany(trainingDataList: ITrainingData[]): void {
    for (let i = 0; i < trainingDataList.length; i++) {
      this.fit(trainingDataList[i]);
    }
  }
}
