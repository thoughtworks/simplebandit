"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BanditOracle = void 0;
const math = __importStar(require("mathjs"));
const DEFAULT_PROBABILITY = 0.1;
class BanditOracle {
    constructor(actionIds = [], context = [], actionFeatures = [], learningRate = 0.5, contextActionInteractions = true, contextActionFeatureInteractions = true, useInversePropensityWeighting = false, negativeClassWeight = 1.0, targetLabel = 'label', weights = {}) {
        if (!Array.isArray(context) || !Array.isArray(actionFeatures) || !Array.isArray(actionIds)) {
            throw new Error("Context features, exercise features, and exercise names must be arrays.");
        }
        if (typeof learningRate !== 'number') {
            throw new Error("Learning rate must be a number.");
        }
        if (typeof contextActionInteractions !== 'boolean' || typeof contextActionFeatureInteractions !== 'boolean' ||
            typeof useInversePropensityWeighting !== 'boolean') {
            throw new Error("Context-exercise interactions, context-exercise feature interactions, inverse propensity weighting must be booleans.");
        }
        this.addIntercept = true;
        this.setFeaturesAndUpdateWeights(actionIds, context, actionFeatures, contextActionInteractions, contextActionFeatureInteractions, weights);
        this.targetLabel = targetLabel;
        this.learningRate = learningRate;
        this.useInversePropensityWeighting = useInversePropensityWeighting;
        this.negativeClassWeight = negativeClassWeight;
    }
    getOracleState() {
        return {
            actionIds: this.actionIds,
            context: this.context,
            actionFeatures: this.actionFeatures,
            learningRate: this.learningRate,
            contextActionInteractions: this.contextActionInteractions,
            contextActionFeatureInteractions: this.contextActionFeatureInteractions,
            useInversePropensityWeighting: this.useInversePropensityWeighting,
            negativeClassWeight: this.negativeClassWeight,
            targetLabel: this.targetLabel,
            weights: this.getWeightsHash(),
        };
    }
    static fromOracleState(oracleState) {
        return new BanditOracle(oracleState.actionIds, oracleState.context, oracleState.actionFeatures, oracleState.learningRate, oracleState.contextActionInteractions, oracleState.contextActionFeatureInteractions, oracleState.useInversePropensityWeighting, oracleState.negativeClassWeight, oracleState.targetLabel, oracleState.weights);
    }
    toJSON() {
        return JSON.stringify(this.getOracleState());
    }
    static fromJSON(json) {
        let oracleState = JSON.parse(json);
        return BanditOracle.fromOracleState(oracleState);
    }
    getFeatures() {
        let features = [...this.actionIds, ...this.actionFeatures, ...this.interactionFeatures];
        return features;
    }
    getInteractionFeatures() {
        let interactionFeatures = [];
        if (this.contextActionInteractions) {
            for (let i = 0; i < this.context.length; i++) {
                for (let j = 0; j < this.actionIds.length; j++) {
                    interactionFeatures.push(this.context[i] + '*' + this.actionIds[j]);
                }
            }
        }
        if (this.contextActionFeatureInteractions) {
            for (let i = 0; i < this.context.length; i++) {
                for (let j = 0; j < this.actionFeatures.length; j++) {
                    interactionFeatures.push(this.context[i] + '*' + this.actionFeatures[j]);
                }
            }
        }
        return interactionFeatures;
    }
    getNFeatures() {
        if (this.addIntercept) {
            return this.features.length + 1;
        }
        else {
            return this.features.length;
        }
    }
    zeroWeights(nFeatures) {
        return Array(nFeatures)
            .fill(null)
            .map(() => [0])
            .flat();
    }
    updateWeights(newWeights = {}) {
        const combinedWeights = Object.assign(Object.assign({}, this.getWeightsHash()), newWeights);
        this.weights = this.zeroWeights(this.getNFeatures());
        if (this.addIntercept) {
            this.weights[0] = combinedWeights['intercept'] || this.weights[0];
            for (let i = 0; i < this.features.length; i++) {
                this.weights[i + 1] = combinedWeights[this.features[i]] || this.weights[i + 1];
            }
        }
        else {
            for (let i = 0; i < this.features.length; i++) {
                this.weights[i] = combinedWeights[this.features[i]] || this.weights[i];
            }
        }
        return this.weights;
    }
    setFeaturesAndUpdateWeights(actionIds, context, actionFeatures, contextActionInteractions, contextActionFeatureInteractions, weights = {}) {
        this.actionIds = actionIds !== null && actionIds !== void 0 ? actionIds : this.actionIds;
        this.context = context !== null && context !== void 0 ? context : this.context;
        this.actionFeatures = actionFeatures !== null && actionFeatures !== void 0 ? actionFeatures : this.actionFeatures;
        this.contextActionInteractions = contextActionInteractions !== null && contextActionInteractions !== void 0 ? contextActionInteractions : this.contextActionInteractions;
        this.contextActionFeatureInteractions = contextActionFeatureInteractions !== null && contextActionFeatureInteractions !== void 0 ? contextActionFeatureInteractions : this.contextActionFeatureInteractions;
        this.allInputFeatures = [...this.context, ...this.actionFeatures];
        this.interactionFeatures = this.getInteractionFeatures();
        this.features = this.getFeatures();
        this.nFeatures = this.getNFeatures();
        this.weights = this.updateWeights(weights);
    }
    getWeightsHash() {
        let result = {};
        if (this.weights == undefined) {
            return result;
        }
        if (this.addIntercept) {
            result['intercept'] = this.weights[0];
        }
        if (this.features !== undefined) {
            this.features.forEach((key, i) => {
                result[key] = this.weights[i + 1];
            });
        }
        return result;
    }
    getWeightsMap(round = 3) {
        const result = new Map();
        if (this.addIntercept) {
            result.set('intercept', Number(this.weights[0]).toFixed(round));
            this.features.forEach((key, i) => {
                result.set(key, Number(this.weights[i + 1]).toFixed(round));
            });
        }
        else {
            this.features.forEach((key, i) => {
                result.set(key, Number(this.weights[i]).toFixed(round));
            });
        }
        return result;
    }
    hashContainsAllKeys(hash, keys) {
        for (let i = 0; i < keys.length; i++) {
            if (!hash.hasOwnProperty(keys[i])) {
                return false;
            }
        }
        return true;
    }
    addActionIdFeatures(inputsHash, actionId = undefined) {
        for (let i = 0; i < this.actionIds.length; i++) {
            if (this.actionIds[i] === actionId) {
                inputsHash[this.actionIds[i]] = 1;
            }
            else {
                inputsHash[this.actionIds[i]] = 0;
            }
        }
        return inputsHash;
    }
    addInteractionFeatures(inputsHash) {
        if (this.contextActionInteractions) {
            for (let i = 0; i < this.context.length; i++) {
                for (let j = 0; j < this.actionIds.length; j++) {
                    inputsHash[this.context[i] + '*' + this.actionIds[j]] =
                        inputsHash[this.context[i]] * inputsHash[this.actionIds[j]];
                }
            }
        }
        if (this.contextActionFeatureInteractions) {
            for (let i = 0; i < this.context.length; i++) {
                for (let j = 0; j < this.actionFeatures.length; j++) {
                    inputsHash[this.context[i] + '*' + this.actionFeatures[j]] =
                        inputsHash[this.context[i]] * inputsHash[this.actionFeatures[j]];
                }
            }
        }
        return inputsHash;
    }
    getOrderedInputsArray(actionId = undefined, context, actionFeatures) {
        let inputsHash = Object.assign(Object.assign({}, context), actionFeatures);
        if (!this.hashContainsAllKeys(inputsHash, this.allInputFeatures)) {
            // throw error with missing features:
            const missingFeatures = [];
            this.allInputFeatures.forEach(feature => {
                if (!inputsHash.hasOwnProperty(feature)) {
                    missingFeatures.push(feature);
                }
            });
            throw new Error(`Missing features in inputsHash: ${missingFeatures}`);
        }
        inputsHash = this.addActionIdFeatures(inputsHash, actionId);
        inputsHash = this.addInteractionFeatures(inputsHash);
        const inputsArray = [];
        if (this.addIntercept) {
            inputsArray.push(1);
        }
        for (const feature of this.features) {
            inputsArray.push(inputsHash[feature]);
        }
        return [inputsArray];
    }
    sigmoid(z) {
        return math.evaluate(`1 ./ (1 + e.^-z)`, { z });
    }
    predictLogit(contextInputs, actionInputs, actionId) {
        const X = this.getOrderedInputsArray(actionId, contextInputs, actionInputs);
        const logit = math.evaluate(`X * weights`, { X, weights: this.weights })[0];
        return logit;
    }
    predict(contextInputs, actionInputs, actionId) {
        const logit = this.predictLogit(contextInputs, actionInputs, actionId);
        const proba = this.sigmoid(logit);
        return proba;
    }
    fit(trainingData) {
        var _a, _b, _c, _d;
        if ((this.targetLabel in trainingData) && (trainingData[this.targetLabel] != undefined)) {
            const X = this.getOrderedInputsArray((_a = trainingData.actionId) !== null && _a !== void 0 ? _a : undefined, (_b = trainingData.context) !== null && _b !== void 0 ? _b : {}, (_c = trainingData.actionFeatures) !== null && _c !== void 0 ? _c : {});
            const y = [trainingData[this.targetLabel]];
            let sampleWeight = 1;
            if (this.useInversePropensityWeighting) {
                sampleWeight = 1 / ((_d = trainingData.probability) !== null && _d !== void 0 ? _d : DEFAULT_PROBABILITY);
            }
            if (y[0] == 0) {
                sampleWeight = sampleWeight * this.negativeClassWeight;
            }
            const pred = this.sigmoid(math.evaluate(`X * weights`, { X, weights: this.weights }));
            this.weights = math.evaluate(`weights - sampleWeight * learningRate / 1 * ((pred - y)' * X)'`, { weights: this.weights, sampleWeight: sampleWeight, learningRate: this.learningRate, pred, y, X });
        }
    }
    fitMany(trainingDataList) {
        for (let i = 0; i < trainingDataList.length; i++) {
            this.fit(trainingDataList[i]);
        }
    }
}
exports.BanditOracle = BanditOracle;
