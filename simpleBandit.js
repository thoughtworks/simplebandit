(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
const { SimpleOracle, SimpleBandit } = require("./src");
window.SimpleOracle = SimpleOracle;
window.SimpleBandit = SimpleBandit;
module.exports = {
    SimpleOracle,
    SimpleBandit,
};

},{"./src":5}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SampleFromProbabilityDistribution = void 0;
const SampleFromProbabilityDistribution = (probs) => {
    if (probs.length === 0) {
        throw new Error("probs array must not be empty");
    }
    if (!probs.every((prob) => prob >= 0)) {
        throw new Error("probs array must contain only non-negative numbers");
    }
    if (!probs.every((prob) => prob <= 1)) {
        throw new Error("probs array must contain numbers between 0 and 1");
    }
    const sum = probs.reduce((a, b) => a + b, 0);
    if (sum <= 0) {
        throw Error("probs must sum to a value greater than zero");
    }
    const normalized = probs.map((prob) => prob / sum);
    const sample = Math.random();
    let total = 0;
    for (let i = 0; i < normalized.length; i++) {
        total += normalized[i];
        if (sample < total) {
            return i;
        }
    }
    return -1;
};
exports.SampleFromProbabilityDistribution = SampleFromProbabilityDistribution;

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleBandit = void 0;
const Sampling_1 = require("./Sampling");
const SimpleOracle_1 = require("./SimpleOracle");
class SimpleBandit {
    constructor({ oracles, actions, temperature = 0.5, slateSize = 1, }) {
        this.oracles = Array.isArray(oracles)
            ? oracles
            : oracles
                ? [oracles]
                : [new SimpleOracle_1.SimpleOracle()];
        this.targetLabels = this.oracles.map((oracle) => oracle.targetLabel);
        const processedActions = actions.map((action) => typeof action === "string" ? { actionId: action, features: {} } : action);
        this.actionsMap = processedActions.reduce((acc, obj) => {
            acc[obj.actionId] = obj;
            return acc;
        }, {});
        this.temperature = temperature;
        this.slateSize = slateSize;
    }
    toState() {
        return {
            oracleStates: this.oracles.map((oracle) => oracle.getOracleState()),
            temperature: this.temperature,
            slateSize: this.slateSize,
        };
    }
    static fromState(state, actions) {
        const oracles = state.oracleStates.map((oracleState) => SimpleOracle_1.SimpleOracle.fromOracleState(oracleState));
        return new SimpleBandit({
            oracles: oracles,
            actions: actions,
            temperature: state.temperature,
            slateSize: state.slateSize,
        });
    }
    toJSON() {
        return JSON.stringify(this.toState());
    }
    static fromJSON(json, actions) {
        const state = JSON.parse(json);
        return SimpleBandit.fromState(state, actions);
    }
    _getActionScore(actionId, context, features) {
        return this.oracles.reduce((score, oracle) => score +
            oracle.oracleWeight * oracle.predict(actionId, context, features), 0);
    }
    getScoredActions(context = {}) {
        let scoredActions = [];
        const actionIds = Object.keys(this.actionsMap);
        for (let i = 0; i < actionIds.length; i++) {
            const actionId = actionIds[i];
            const action = this.actionsMap[actionId];
            const actionScore = this._getActionScore(action.actionId, context, action.features);
            const softmaxNumerator = Math.exp(actionScore / this.temperature);
            scoredActions.push({
                actionId: actionId,
                score: actionScore,
                probability: softmaxNumerator,
            });
        }
        const SoftmaxDenominator = scoredActions.reduce((a, b) => a + b.probability, 0);
        scoredActions = scoredActions.map((ex) => ({
            actionId: ex.actionId,
            score: ex.score,
            probability: ex.probability / SoftmaxDenominator,
        }));
        return scoredActions;
    }
    getScoredActionsPerOracle(context = {}) {
        const scoredActions = this.getScoredActions(context);
        const scoredActionsPerOracle = [];
        for (let scoredAction of scoredActions) {
            const scoredActionPerOracle = {
                actionId: scoredAction.actionId,
                weightedScore: scoredAction.score,
                probability: scoredAction.probability,
            };
            for (let oracle of this.oracles) {
                const oracleScore = oracle.predict(scoredAction.actionId, context, this.actionsMap[scoredAction.actionId].features);
                scoredActionPerOracle[oracle.name] = oracleScore;
            }
            scoredActionsPerOracle.push(scoredActionPerOracle);
        }
        return scoredActionsPerOracle;
    }
    _generateClickOracleTrainingData(recommendation, selectedActionId = undefined) {
        if ("actionId" in recommendation) {
            const trainingData = [
                {
                    recommendationId: recommendation.recommendationId,
                    actionId: recommendation.actionId,
                    features: this.actionsMap[recommendation.actionId].features,
                    context: recommendation.context,
                    click: recommendation.actionId === selectedActionId ? 1 : 0,
                    probability: recommendation.probability,
                },
            ];
            return trainingData;
        }
        else {
            const trainingData = [];
            for (let index = 0; index < recommendation.slateActions.length; index++) {
                const actionId = recommendation.slateActions[index].actionId;
                const recommendedAction = this.actionsMap[actionId];
                if (!recommendedAction) {
                    throw new Error(`Failed to generate training data for recommended exercise at index ${index}.`);
                }
                const context = recommendation.context;
                const features = recommendedAction.features;
                const click = recommendedAction.actionId === selectedActionId ? 1 : 0;
                const probability = recommendation.slateActions[index].probability;
                trainingData.push({
                    recommendationId: recommendation.recommendationId,
                    actionId: actionId,
                    features: features,
                    context: context,
                    click: click,
                    probability: probability,
                });
            }
            return trainingData;
        }
    }
    _generateRecommendationId() {
        return 'id-' + Math.random().toString(36).substr(2, 16) + '-' + Date.now().toString(36);
    }
    recommend(context = {}) {
        const scoredActions = this.getScoredActions(context);
        const probabilities = scoredActions.map((action) => action.probability);
        const sampleIndex = (0, Sampling_1.SampleFromProbabilityDistribution)(probabilities);
        const recommendedAction = scoredActions[sampleIndex];
        const recommendation = {
            recommendationId: this._generateRecommendationId(),
            context: context,
            actionId: recommendedAction.actionId,
            score: recommendedAction.score,
            probability: recommendedAction.probability,
        };
        return recommendation;
    }
    slate(context = {}) {
        const scoredActions = this.getScoredActions(context);
        const slateActions = [];
        for (let index = 0; index < this.slateSize; index++) {
            const probabilities = scoredActions.map((action) => action.probability);
            const sampleIndex = (0, Sampling_1.SampleFromProbabilityDistribution)(probabilities);
            // const sampleIndex = this._sampleFromActionScores(scoredActions);
            slateActions[index] = scoredActions[sampleIndex];
            scoredActions.splice(sampleIndex, 1);
        }
        const slate = {
            recommendationId: this._generateRecommendationId(),
            context: context,
            slateActions: slateActions,
        };
        return slate;
    }
    accept(recommendation) {
        return new Promise((resolve, reject) => {
            try {
                if (!this.targetLabels.includes("click")) {
                    throw new Error("no oracle with `click` as targetLabel, so cannot use accept()");
                }
                const trainingData = this._generateClickOracleTrainingData(recommendation, recommendation.actionId);
                this.train(trainingData);
                resolve(trainingData);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    choose(slate, actionId) {
        return new Promise((resolve, reject) => {
            try {
                if (!this.targetLabels.includes("click")) {
                    throw new Error("no oracle with `click` as targetLabel, so cannot use accept()");
                }
                if (actionId == undefined) {
                    throw new Error(`need to provide actionId`);
                }
                const actionIds = slate.slateActions.map((action) => action.actionId);
                if (!actionIds.includes(actionId)) {
                    throw new Error(`ActionId ${actionId} is not in slateActions`);
                }
                const trainingData = this._generateClickOracleTrainingData(slate, actionId);
                this.train(trainingData);
                resolve(trainingData);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    reject(recommendation) {
        return new Promise((resolve, reject) => {
            try {
                if (!this.targetLabels.includes("click")) {
                    throw new Error("no oracle with `click` as targetLabel, so cannot use accept()");
                }
                const trainingData = this._generateClickOracleTrainingData(recommendation, undefined);
                this.train(trainingData);
                resolve(trainingData);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    feedback(recommendation_or_slate, label, value, actionId = undefined) {
        return new Promise((resolve, reject) => {
            try {
                if (!this.targetLabels.includes(label)) {
                    throw new Error(`label ${label} not in any of weightedOracles`);
                }
                let recommendedAction;
                let probability;
                if ("actionId" in recommendation_or_slate) {
                    // IRecommendation
                    if (actionId && actionId !== recommendation_or_slate.actionId) {
                        throw new Error(`actionId ${actionId} does not match recommendation.actionId ${recommendation_or_slate.actionId}`);
                    }
                    recommendedAction = this.actionsMap[recommendation_or_slate.actionId];
                    probability = recommendation_or_slate.probability;
                }
                else {
                    // ISlate
                    if (actionId === undefined) {
                        throw new Error(`actionId must be provided for slate`);
                    }
                    const foundAction = recommendation_or_slate.slateActions.find((action) => action.actionId === actionId);
                    if (!foundAction) {
                        throw new Error(`No action found in slate with actionId ${actionId}`);
                    }
                    if (!this.actionsMap.hasOwnProperty(actionId)) {
                        throw new Error(`No action found for this bandit with actionId ${actionId}`);
                    }
                    recommendedAction = this.actionsMap[actionId];
                    probability = foundAction.probability;
                }
                const trainingData = [
                    {
                        recommendationId: recommendation_or_slate.recommendationId,
                        actionId: recommendedAction.actionId,
                        features: recommendedAction.features,
                        context: recommendation_or_slate.context,
                        [label]: value,
                        probability: probability,
                    },
                ];
                this.train(trainingData);
                resolve(trainingData);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    train(trainingData) {
        return new Promise((resolve, reject) => {
            try {
                for (const oracle of this.oracles) {
                    oracle.fit(trainingData);
                }
                resolve();
            }
            catch (error) {
                reject(error);
            }
        });
    }
}
exports.SimpleBandit = SimpleBandit;

},{"./Sampling":2,"./SimpleOracle":4}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleOracle = void 0;
class SimpleOracle {
    constructor({ actionIds = undefined, context = undefined, features = undefined, learningRate = 1.0, actionIdFeatures = true, actionFeatures = true, contextActionIdInteractions = true, contextActionFeatureInteractions = true, useInversePropensityWeighting = true, targetLabel = "click", name = undefined, oracleWeight = 1.0, weights = {}, } = {}) {
        if ((actionIds !== undefined &&
            !(Array.isArray(actionIds) &&
                actionIds.every((item) => typeof item === "string"))) ||
            (context !== undefined &&
                !(Array.isArray(context) &&
                    context.every((item) => typeof item === "string"))) ||
            (features !== undefined &&
                !(Array.isArray(features) &&
                    features.every((item) => typeof item === "string")))) {
            throw new Error("actionIds, context, features must be arrays of strings or undefined.");
        }
        if (typeof learningRate !== "number" || learningRate <= 0) {
            throw new Error("Invalid argument: learningRate must be a positive number.");
        }
        if (typeof actionIdFeatures !== "boolean" ||
            typeof actionFeatures !== "boolean" ||
            typeof contextActionIdInteractions !== "boolean" ||
            typeof contextActionFeatureInteractions !== "boolean" ||
            typeof useInversePropensityWeighting !== "boolean") {
            throw new Error("actionIdFeatures, actionFeatures, contextActionIdInteractions, contextActionFeatureInteractions, useInversePropensityWeighting must be booleans.");
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
        this.useInversePropensityWeighting = useInversePropensityWeighting;
        this.name = name || targetLabel;
        this.oracleWeight = oracleWeight;
        this.weights = weights;
    }
    getOracleState() {
        return {
            actionIds: this.actionIds,
            context: this.context,
            features: this.features,
            learningRate: this.learningRate,
            actionIdFeatures: this.actionIdFeatures,
            actionFeatures: this.actionFeatures,
            contextActionIdInteractions: this.contextActionIdInteractions,
            contextActionFeatureInteractions: this.contextActionFeatureInteractions,
            useInversePropensityWeighting: this.useInversePropensityWeighting,
            targetLabel: this.targetLabel,
            name: this.name,
            oracleWeight: this.oracleWeight,
            weights: this.weights,
        };
    }
    static fromOracleState(oracleState) {
        return new SimpleOracle({
            actionIds: oracleState.actionIds,
            context: oracleState.context,
            features: oracleState.features,
            learningRate: oracleState.learningRate,
            actionIdFeatures: oracleState.actionIdFeatures,
            actionFeatures: oracleState.actionFeatures,
            contextActionIdInteractions: oracleState.contextActionIdInteractions,
            contextActionFeatureInteractions: oracleState.contextActionFeatureInteractions,
            useInversePropensityWeighting: oracleState.useInversePropensityWeighting,
            targetLabel: oracleState.targetLabel,
            name: oracleState.name,
            oracleWeight: oracleState.oracleWeight,
            weights: oracleState.weights,
        });
    }
    toJSON() {
        return JSON.stringify(this.getOracleState());
    }
    static fromJSON(json) {
        const oracleState = JSON.parse(json);
        return SimpleOracle.fromOracleState(oracleState);
    }
    _sigmoid(z) {
        return 1 / (1 + Math.exp(-z));
    }
    _getModelInputsWeightsAndLogit(actionId, context = {}, features = {}) {
        const inputs = {};
        const weights = {};
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
                        throw new Error("Feature values must be between -1 and 1! But got features=`${features}`");
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
                            if (context[contextFeature] > 1 ||
                                context[contextFeature] < -1 ||
                                features[actionFeature] > 1 ||
                                features[actionFeature] < -1) {
                                throw new Error("Context and feature values must be between -1 and 1! But got context=`${context}` and features=`${features}`");
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
    predict(actionId, context = {}, features = {}) {
        const processedInput = this._getModelInputsWeightsAndLogit(actionId, context, features);
        return this._sigmoid(processedInput["logit"]);
    }
    fit(trainingData) {
        var _a, _b;
        if (!Array.isArray(trainingData)) {
            trainingData = [trainingData];
        }
        for (const data of trainingData) {
            if (data[this.targetLabel] !== undefined) {
                const processedInput = this._getModelInputsWeightsAndLogit(data.actionId, (_a = data.context) !== null && _a !== void 0 ? _a : {}, (_b = data.features) !== null && _b !== void 0 ? _b : {});
                const y = data[this.targetLabel];
                if (y > 1 || y < 0) {
                    throw new Error("Target label must be between 0 and 1! But got `${this.targetLabel}`=`${y}`");
                }
                let sampleWeight = 1;
                if (this.useInversePropensityWeighting) {
                    sampleWeight = 1 / data.probability;
                }
                const pred = this._sigmoid(processedInput["logit"]);
                const grad = sampleWeight * this.learningRate * (pred - y);
                for (const feature in processedInput.inputs) {
                    this.weights[feature] =
                        processedInput.weights[feature] -
                            grad * processedInput.inputs[feature];
                }
            }
            else {
                // silently ignore training data without targetLabel: not meant for this oracle
            }
        }
    }
}
exports.SimpleOracle = SimpleOracle;

},{}],5:[function(require,module,exports){
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./interfaces"), exports);
__exportStar(require("./SimpleOracle"), exports);
__exportStar(require("./SimpleBandit"), exports);

},{"./SimpleBandit":3,"./SimpleOracle":4,"./interfaces":12}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],7:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],8:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],9:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],10:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],11:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],12:[function(require,module,exports){
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./IAction"), exports);
__exportStar(require("./IRecommendation"), exports);
__exportStar(require("./ISimpleBandit"), exports);
__exportStar(require("./ISimpleOracle"), exports);
__exportStar(require("./IState"), exports);
__exportStar(require("./ITrainingData"), exports);

},{"./IAction":6,"./IRecommendation":7,"./ISimpleBandit":8,"./ISimpleOracle":9,"./IState":10,"./ITrainingData":11}]},{},[1]);
