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
        this.oracles = Array.isArray(oracles) ? oracles : [oracles];
        this.targetLabels = this.oracles.map((oracle) => oracle.targetLabel);
        this.actionsMap = actions.reduce((acc, obj) => {
            acc[obj.actionId] = obj;
            return acc;
        }, {});
        this.temperature = temperature;
        this.slateSize = slateSize;
    }
    static fromActions({ actions, temperature = 5.0, learningRate = 1.0, slateSize = 1, }) {
        const actionFeatures = [
            ...new Set(actions.flatMap((action) => Object.keys(action.features))),
        ];
        const actionIds = actions.map((action) => action.actionId);
        const oracle = new SimpleOracle_1.SimpleOracle({
            actionIds: actionIds,
            context: [],
            actionFeatures: actionFeatures,
            learningRate: learningRate,
        });
        return new SimpleBandit({
            oracles: [oracle],
            actions: actions,
            temperature: temperature,
            slateSize: slateSize,
        });
    }
    static fromContextAndActions({ context, actions, temperature = 0.5, learningRate = 1.0, slateSize = 1, }) {
        const actionFeatures = [
            ...new Set(actions.flatMap((action) => Object.keys(action.features))),
        ];
        const actionIds = actions.map((action) => action.actionId);
        const oracle = new SimpleOracle_1.SimpleOracle({
            actionIds: actionIds,
            context: context,
            actionFeatures: actionFeatures,
            learningRate: learningRate,
        });
        return new SimpleBandit({
            oracles: [oracle],
            actions: actions,
            temperature: temperature,
            slateSize: slateSize,
        });
    }
    static fromActionIds({ actionIds, temperature = 0.5, learningRate = 1.0, slateSize = 1, }) {
        const actions = actionIds.map((actionId) => ({
            actionId: actionId,
            features: {},
        }));
        return SimpleBandit.fromActions({
            actions,
            temperature,
            learningRate,
            slateSize,
        });
    }
    static fromContextAndActionIds({ context, actionIds, temperature = 0.5, learningRate = 1.0, slateSize = 1, }) {
        const actions = actionIds.map((actionId) => ({
            actionId: actionId,
            features: {},
        }));
        return SimpleBandit.fromContextAndActions({
            context,
            actions,
            temperature,
            learningRate,
            slateSize,
        });
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
        let SoftmaxDenominator = scoredActions.reduce((a, b) => a + b.probability, 0);
        scoredActions = scoredActions.map((ex) => ({
            actionId: ex.actionId,
            score: ex.score,
            probability: ex.probability / SoftmaxDenominator,
        }));
        return scoredActions;
    }
    getScoredActionsPerOracle(context = {}) {
        let actionScoresPerOracle = [];
        for (const [actionId, action] of Object.entries(this.actionsMap)) {
            for (const oracle of this.oracles) {
                const score = oracle.predict(actionId, context, action.features);
                actionScoresPerOracle.push({
                    actionId: actionId,
                    [oracle.targetLabel]: score,
                    name: oracle.name,
                    weight: oracle.oracleWeight,
                });
            }
        }
        return actionScoresPerOracle;
    }
    _generateClickOracleTrainingData(recommendation, selectedActionId = undefined) {
        if ("actionId" in recommendation) {
            let trainingData = [
                {
                    actionId: recommendation.actionId,
                    actionFeatures: this.actionsMap[recommendation.actionId].features,
                    context: recommendation.context,
                    click: recommendation.actionId === selectedActionId ? 1 : 0,
                    probability: recommendation.probability,
                },
            ];
            return trainingData;
        }
        else {
            let trainingData = [];
            for (let index = 0; index < recommendation.slateActions.length; index++) {
                const actionId = recommendation.slateActions[index].actionId;
                const recommendedAction = this.actionsMap[actionId];
                if (!recommendedAction) {
                    throw new Error(`Failed to generate training data for recommended exercise at index ${index}.`);
                }
                const context = recommendation.context;
                const actionFeatures = recommendedAction.features;
                const click = recommendedAction.actionId === selectedActionId ? 1 : 0;
                const probability = recommendation.slateActions[index].probability;
                trainingData.push({
                    actionId: actionId,
                    actionFeatures: actionFeatures,
                    context: context,
                    click: click,
                    probability: probability,
                });
            }
            return trainingData;
        }
    }
    recommend(context = {}) {
        let scoredActions = this.getScoredActions(context);
        const probabilities = scoredActions.map((action) => action.probability);
        const sampleIndex = (0, Sampling_1.SampleFromProbabilityDistribution)(probabilities);
        const recommendedAction = scoredActions[sampleIndex];
        const recommendation = {
            context: context,
            actionId: recommendedAction.actionId,
            score: recommendedAction.score,
            probability: recommendedAction.probability,
        };
        return recommendation;
    }
    slate(context = {}) {
        let scoredActions = this.getScoredActions(context);
        let slateActions = [];
        for (let index = 0; index < this.slateSize; index++) {
            const probabilities = scoredActions.map((action) => action.probability);
            const sampleIndex = (0, Sampling_1.SampleFromProbabilityDistribution)(probabilities);
            // const sampleIndex = this._sampleFromActionScores(scoredActions);
            slateActions[index] = scoredActions[sampleIndex];
            scoredActions.splice(sampleIndex, 1);
        }
        const slate = {
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
                        actionId: recommendedAction.actionId,
                        actionFeatures: recommendedAction.features,
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
                for (let oracle of this.oracles) {
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
const DEFAULT_PROBABILITY = 0.1;
const DEFAULT_LEARNING_RATE = 0.5;
class SimpleOracle {
    constructor({ actionIds = undefined, context = undefined, actionFeatures = undefined, learningRate = DEFAULT_LEARNING_RATE, // example default value
    actionIdFeatures = true, contextActionIdInteractions = true, contextActionFeatureInteractions = true, useInversePropensityWeighting = true, targetLabel = "click", name = "click", oracleWeight = 1.0, weights = {}, } = {}) {
        if ((actionIds !== undefined &&
            !(Array.isArray(actionIds) &&
                actionIds.every((item) => typeof item === "string"))) ||
            (context !== undefined &&
                !(Array.isArray(context) &&
                    context.every((item) => typeof item === "string"))) ||
            (actionFeatures !== undefined &&
                !(Array.isArray(actionFeatures) &&
                    actionFeatures.every((item) => typeof item === "string")))) {
            throw new Error("actionIds, context, actionFeatures must be arrays of strings or undefined.");
        }
        if (typeof learningRate !== "number" || learningRate <= 0) {
            throw new Error("Invalid argument: learningRate must be a positive number.");
        }
        if (typeof actionIdFeatures !== "boolean" ||
            typeof contextActionIdInteractions !== "boolean" ||
            typeof contextActionFeatureInteractions !== "boolean" ||
            typeof useInversePropensityWeighting !== "boolean") {
            throw new Error("actionIdFeatures, contextActionIdInteractions, contextActionFeatureInteractions, useInversePropensityWeighting must be booleans.");
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
    getOracleState() {
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
    static fromOracleState(oracleState) {
        return new SimpleOracle({
            actionIds: oracleState.actionIds,
            context: oracleState.context,
            actionFeatures: oracleState.actionFeatures,
            learningRate: oracleState.learningRate,
            actionIdFeatures: oracleState.actionIdFeatures,
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
        let oracleState = JSON.parse(json);
        return SimpleOracle.fromOracleState(oracleState);
    }
    _sigmoid(z) {
        return 1 / (1 + Math.exp(-z));
    }
    _getModelInputsWeightsAndLogit(actionId, contextInputs = {}, actionInputs = {}) {
        let inputs = {};
        let weights = {};
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
                if (!this.actionFeatures ||
                    this.actionFeatures.includes(actionFeature)) {
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
    predict(actionId, contextInputs = {}, actionInputs = {}) {
        const processedInput = this._getModelInputsWeightsAndLogit(actionId, contextInputs, actionInputs);
        return this._sigmoid(processedInput["logit"]);
    }
    fit(trainingData) {
        var _a, _b, _c;
        if (!Array.isArray(trainingData)) {
            trainingData = [trainingData];
        }
        for (let data of trainingData) {
            if (data[this.targetLabel] !== undefined) {
                const processedInput = this._getModelInputsWeightsAndLogit(data.actionId, (_a = data.contextInputs) !== null && _a !== void 0 ? _a : {}, (_b = data.actionInputs) !== null && _b !== void 0 ? _b : {});
                const y = data[this.targetLabel];
                let sampleWeight = 1;
                if (this.useInversePropensityWeighting) {
                    sampleWeight = 1 / ((_c = data.probability) !== null && _c !== void 0 ? _c : DEFAULT_PROBABILITY);
                }
                const pred = this._sigmoid(processedInput["logit"]);
                const grad = sampleWeight * this.learningRate * (pred - y);
                for (let feature in processedInput.inputs) {
                    this.weights[feature] =
                        processedInput.weights[feature] -
                            grad * processedInput.inputs[feature];
                }
            }
            else {
                // silently ignore training data without target label:
                // not meant for this oracle
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
