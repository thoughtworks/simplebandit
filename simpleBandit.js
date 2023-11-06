(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
const { SimpleOracle, SimpleBandit, MultiBandit, WeightedBandit, WeightedMultiBandit, } = require("./src");
window.SimpleOracle = SimpleOracle;
window.SimpleBandit = SimpleBandit;
window.MultiBandit = MultiBandit;
window.WeightedBandit = WeightedBandit;
window.WeightedMultiBandit = WeightedMultiBandit;
module.exports = {
    SimpleOracle,
    SimpleBandit,
    MultiBandit,
    WeightedBandit,
    WeightedMultiBandit,
};

},{"./src":7}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiBanditMixin = exports.SimpleBanditMixin = void 0;
function SimpleBanditMixin(Base) {
    return class extends Base {
        recommend(context = {}) {
            let scoredActions = this.getScoredActions(context);
            const sampleIndex = this._sampleFromActionScores(scoredActions);
            const recommendedAction = scoredActions[sampleIndex];
            const recommendation = {
                context: context,
                actionId: recommendedAction.actionId,
                score: recommendedAction.score,
                probability: recommendedAction.probability,
            };
            return recommendation;
        }
        accept(recommendation) {
            return new Promise((resolve, reject) => {
                try {
                    const trainingData = this._generateClickOracleTrainingData(recommendation, recommendation.actionId);
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
                    const trainingData = this._generateClickOracleTrainingData(recommendation, undefined);
                    this.train(trainingData);
                    resolve(trainingData);
                }
                catch (error) {
                    reject(error);
                }
            });
        }
    };
}
exports.SimpleBanditMixin = SimpleBanditMixin;
function MultiBanditMixin(Base) {
    return class extends Base {
        constructor(...args) {
            super(...args);
            this.nRecommendations = args[args.length - 1] || 1;
        }
        recommend(context = {}) {
            let scoredActions = this.getScoredActions(context);
            let recommendedActions = [];
            for (let index = 0; index < this.nRecommendations; index++) {
                const sampleIndex = this._sampleFromActionScores(scoredActions);
                recommendedActions[index] = scoredActions[sampleIndex];
                scoredActions.splice(sampleIndex, 1);
            }
            const recommendation = {
                context: context,
                recommendedActions: recommendedActions,
            };
            return recommendation;
        }
        choose(recommendation, actionId) {
            return new Promise((resolve, reject) => {
                try {
                    const trainingData = this._generateClickOracleTrainingData(recommendation, actionId);
                    this.train(trainingData);
                    resolve(trainingData);
                }
                catch (error) {
                    reject(error);
                }
            });
        }
        rejectAll(recommendation) {
            return this.choose(recommendation, undefined);
        }
    };
}
exports.MultiBanditMixin = MultiBanditMixin;

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeightedMultiBandit = exports.WeightedBandit = exports.MultiBandit = exports.SimpleBandit = void 0;
const SimpleOracle_1 = require("./SimpleOracle");
const BaseBandits_1 = require("./BaseBandits");
const BanditMixins_1 = require("./BanditMixins");
class SimpleBandit extends (0, BanditMixins_1.SimpleBanditMixin)(BaseBandits_1.SingleOracleBandit) {
    static fromContextAndActions({ context, actions, temperature = 5.0, learningRate = 1.0, }) {
        const actionFeatures = [
            ...new Set(actions.flatMap((action) => Object.keys(action.features))),
        ];
        const actionIds = actions.map((action) => action.actionId);
        const banditOracle = new SimpleOracle_1.SimpleOracle({
            actionIds: actionIds,
            context: context,
            actionFeatures: actionFeatures,
            learningRate: learningRate,
        });
        return new SimpleBandit(banditOracle, actions, temperature);
    }
    static fromContextAndActionIds({ context, actionIds, temperature = 5.0, learningRate = 1.0, }) {
        const actions = actionIds.map((actionId) => ({
            actionId: actionId,
            features: {},
        }));
        return SimpleBandit.fromContextAndActions({
            context,
            actions,
            temperature,
            learningRate,
        });
    }
    static fromActions({ actions, temperature = 5.0, learningRate = 1.0, }) {
        const actionFeatures = [
            ...new Set(actions.flatMap((action) => Object.keys(action.features))),
        ];
        const actionIds = actions.map((action) => action.actionId);
        const banditOracle = new SimpleOracle_1.SimpleOracle({
            actionIds: actionIds,
            context: [],
            actionFeatures: actionFeatures,
            learningRate: learningRate,
        });
        return new SimpleBandit(banditOracle, actions, temperature);
    }
    static fromActionIds({ actionIds, temperature = 5.0, learningRate = 1.0, }) {
        const actions = actionIds.map((actionId) => ({
            actionId: actionId,
            features: {},
        }));
        return SimpleBandit.fromActions({ actions, temperature, learningRate });
    }
    toState() {
        return {
            oracleState: this.oracle.getOracleState(),
            temperature: this.temperature,
        };
    }
    static fromSimpleBanditState(state, actions) {
        const banditOracle = SimpleOracle_1.SimpleOracle.fromOracleState(state.oracleState);
        const temperature = state.temperature;
        return new SimpleBandit(banditOracle, actions, temperature);
    }
    static fromJSON(json, actions) {
        const state = JSON.parse(json);
        return SimpleBandit.fromSimpleBanditState(state, actions);
    }
}
exports.SimpleBandit = SimpleBandit;
class MultiBandit extends (0, BanditMixins_1.MultiBanditMixin)(BaseBandits_1.SingleOracleBandit) {
    constructor(oracle, actions, temperature = 0.5, nRecommendations = 1) {
        super(oracle, actions, temperature);
        this.nRecommendations = nRecommendations;
    }
    static fromContextAndActions({ context, actions, temperature = 5.0, learningRate = 1.0, nRecommendations = 3, }) {
        const oracle = new SimpleOracle_1.SimpleOracle({
            actionIds: actions.map((action) => action.actionId),
            context: context,
            actionFeatures: [
                ...new Set(actions.flatMap((action) => Object.keys(action.features))),
            ],
            learningRate: learningRate,
        });
        return new MultiBandit(oracle, actions, temperature, nRecommendations);
    }
    static fromContextAndActionIds({ context, actionIds, temperature = 5.0, learningRate = 1.0, nRecommendations = 3, }) {
        return MultiBandit.fromContextAndActions({
            context: context,
            actions: actionIds.map((actionId) => ({
                actionId: actionId,
                features: {},
            })),
            temperature: temperature,
            learningRate: learningRate,
            nRecommendations: nRecommendations,
        });
    }
    static fromActions({ actions, temperature = 5.0, learningRate = 1.0, nRecommendations = 3, }) {
        const oracle = new SimpleOracle_1.SimpleOracle({
            actionIds: actions.map((action) => action.actionId),
            actionFeatures: [
                ...new Set(actions.flatMap((action) => Object.keys(action.features))),
            ],
            learningRate: learningRate,
        });
        return new MultiBandit(oracle, actions, temperature, nRecommendations);
    }
    static fromActionIds({ actionIds, temperature = 5.0, learningRate = 1.0, nRecommendations = 3, }) {
        return MultiBandit.fromActions({
            actions: actionIds.map((actionId) => ({
                actionId: actionId,
                features: {},
            })),
            temperature: temperature,
            learningRate: learningRate,
            nRecommendations: nRecommendations,
        });
    }
    static fromJSON(json, actions) {
        const state = JSON.parse(json);
        return MultiBandit.fromState(state, actions);
    }
    static fromState(state, actions) {
        const oracle = SimpleOracle_1.SimpleOracle.fromOracleState(state.oracleState);
        const temperature = state.temperature;
        const nRecommendations = state.nRecommendations;
        return new MultiBandit(oracle, actions, temperature, nRecommendations);
    }
    toState() {
        return {
            oracleState: this.oracle.getOracleState(),
            temperature: this.temperature,
            nRecommendations: this.nRecommendations,
        };
    }
}
exports.MultiBandit = MultiBandit;
class WeightedBandit extends (0, BanditMixins_1.SimpleBanditMixin)(BaseBandits_1.BaseWeightedBandit) {
    toState() {
        const oraclesStates = [];
        for (const weightedOracle of this.weightedOracles) {
            oraclesStates.push({
                weight: weightedOracle.weight,
                oracleState: weightedOracle.oracle.getOracleState(),
            });
        }
        return {
            oraclesStates: oraclesStates,
            temperature: this.temperature,
        };
    }
    static fromState(state, actions) {
        const oracles = [];
        for (const oracle of state.oraclesStates) {
            oracles.push({
                oracle: SimpleOracle_1.SimpleOracle.fromOracleState(oracle.oracleState),
                weight: oracle.weight,
            });
        }
        const temperature = state.temperature;
        return new WeightedBandit(oracles, actions, temperature);
    }
    static fromJSON(json, actions) {
        const state = JSON.parse(json);
        return WeightedBandit.fromState(state, actions);
    }
}
exports.WeightedBandit = WeightedBandit;
class WeightedMultiBandit extends (0, BanditMixins_1.MultiBanditMixin)(BaseBandits_1.BaseWeightedBandit) {
    constructor(weightedOracles, actions, temperature = 0.5, nRecommendations = 3) {
        super(weightedOracles, actions, temperature);
        this.nRecommendations = nRecommendations;
    }
    static fromJSON(json, actions) {
        const state = JSON.parse(json);
        return WeightedMultiBandit.fromState(state, actions);
    }
    static fromState(state, actions) {
        const oracles = [];
        for (const oracle of state.oraclesStates) {
            oracles.push({
                oracle: SimpleOracle_1.SimpleOracle.fromOracleState(oracle.oracleState),
                weight: oracle.weight,
            });
        }
        const temperature = state.temperature;
        const nRecommendations = state.nRecommendations;
        return new WeightedMultiBandit(oracles, actions, temperature, nRecommendations);
    }
    toState() {
        const oraclesStates = [];
        for (const weightedOracle of this.weightedOracles) {
            oraclesStates.push({
                weight: weightedOracle.weight,
                oracleState: weightedOracle.oracle.getOracleState(),
            });
        }
        return {
            oraclesStates: oraclesStates,
            temperature: this.temperature,
            nRecommendations: this.nRecommendations,
        };
    }
}
exports.WeightedMultiBandit = WeightedMultiBandit;

},{"./BanditMixins":2,"./BaseBandits":4,"./SimpleOracle":6}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseWeightedBandit = exports.SingleOracleBandit = exports.BaseBandit = void 0;
const MathService_1 = require("./MathService");
class BaseBandit {
    constructor(actions, temperature) {
        this.actionsMap = actions.reduce((acc, obj) => {
            acc[obj.actionId] = obj;
            return acc;
        }, {});
        this.temperature = temperature;
    }
    toState() {
        throw new Error("Not implemented");
    }
    static fromState(state, actions) {
        throw new Error("Not implemented");
    }
    toJSON() {
        return JSON.stringify(this.toState());
    }
    static fromJSON(json, actions) {
        throw new Error("Not implemented");
    }
    _getActionScore(actionId, context, features) {
        throw new Error("Not implemented");
    }
    _sampleFromActionScores(actionScores) {
        const scores = actionScores.map((ex) => ex.score);
        const probabilities = (0, MathService_1.ConvertScoresToProbabilityDistribution)(scores, this.temperature);
        const sampleIndex = (0, MathService_1.SampleFromProbabilityDistribution)(probabilities);
        return sampleIndex;
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
    recommend(context) {
        throw new Error("Not implemented");
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
            for (let index = 0; index < recommendation.recommendedActions.length; index++) {
                const actionId = recommendation.recommendedActions[index].actionId;
                const recommendedAction = this.actionsMap[actionId];
                if (!recommendedAction) {
                    throw new Error(`Failed to generate training data for recommended exercise at index ${index}.`);
                }
                const context = recommendation.context;
                const actionFeatures = recommendedAction.features;
                const click = recommendedAction.actionId === selectedActionId ? 1 : 0;
                const probability = recommendation.recommendedActions[index].probability;
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
    train(trainingData) {
        return new Promise((resolve, reject) => {
            throw new Error("Not implemented");
        });
    }
}
exports.BaseBandit = BaseBandit;
class SingleOracleBandit extends BaseBandit {
    constructor(oracle, actions, temperature = 0.5) {
        super(actions, temperature);
        this.oracle = oracle;
    }
    _getActionScore(actionId, context, features) {
        const actionScore = this.oracle.predict(actionId, context, features);
        return actionScore;
    }
    train(trainingData) {
        return new Promise((resolve, reject) => {
            try {
                this.oracle.fitMany(trainingData);
                resolve();
            }
            catch (error) {
                reject(error);
            }
        });
    }
}
exports.SingleOracleBandit = SingleOracleBandit;
class BaseWeightedBandit extends BaseBandit {
    constructor(weightedOracles, actions, temperature = 0.5) {
        super(actions, temperature);
        this.weightedOracles = weightedOracles;
        const oracleWeights = Object.values(weightedOracles).map((oracle) => oracle.weight);
        if (oracleWeights.some((weight) => weight < 0)) {
            throw new Error("All weights in oracles must be positive numbers.");
        }
        this.targetLabels = Object.values(weightedOracles).map((oracle) => oracle.oracle.targetLabel);
    }
    _getActionScore(actionId, context, features) {
        let actionScore = 0;
        for (const weightedOracle of this.weightedOracles) {
            actionScore +=
                weightedOracle.weight *
                    weightedOracle.oracle.predict(actionId, context, features);
        }
        return actionScore;
    }
    getActionScoresPerOracle(context = {}) {
        let actionScoresPerOracle = [];
        for (const [actionId, action] of Object.entries(this.actionsMap)) {
            for (const weightedOracle of this.weightedOracles) {
                const score = weightedOracle.oracle.predict(actionId, context, action.features);
                actionScoresPerOracle.push({
                    actionId: actionId,
                    [weightedOracle.oracle.targetLabel]: score,
                    weight: weightedOracle.weight,
                });
            }
        }
        return actionScoresPerOracle;
    }
    feedback(recommendation, label, value, actionId = undefined) {
        return new Promise((resolve, reject) => {
            var _a;
            try {
                if (!this.targetLabels.includes(label)) {
                    throw new Error(`label ${label} not in any of weightedOracles`);
                }
                if ("actionId" in recommendation) {
                    if (actionId && actionId !== recommendation.actionId) {
                        throw new Error(`actionId ${actionId} does not match recommendation.actionId ${recommendation.actionId}`);
                    }
                    const recommendedAction = this.actionsMap[recommendation.actionId];
                    const probability = recommendation.probability;
                    const trainingData = [
                        {
                            actionId: recommendation.actionId,
                            actionFeatures: recommendedAction.features,
                            context: recommendation.context,
                            [label]: value,
                            probability: probability,
                        },
                    ];
                    this.train(trainingData);
                    resolve(trainingData);
                }
                else {
                    if (!actionId) {
                        throw new Error(`actionId must be provided for multi-recommendation`);
                    }
                    if (!recommendation.recommendedActions
                        .map((action) => action.actionId)
                        .includes(actionId)) {
                        const recomendationActions = recommendation.recommendedActions.map((action) => action.actionId);
                        throw new Error(`actionId ${actionId} not in recommendation ${recomendationActions}`);
                    }
                    if (!this.targetLabels.includes(label)) {
                        throw new Error(`label ${label} not in any of weightedOracles`);
                    }
                    const recommendedAction = this.actionsMap[actionId];
                    const probability = (_a = recommendation.recommendedActions.find((action) => action.actionId === actionId)) === null || _a === void 0 ? void 0 : _a.probability;
                    const trainingData = [
                        {
                            actionId: actionId,
                            actionFeatures: recommendedAction.features,
                            context: recommendation.context,
                            [label]: value,
                            probability: probability,
                        },
                    ];
                    this.train(trainingData);
                    resolve(trainingData);
                }
            }
            catch (error) {
                reject(error);
            }
        });
    }
    recommend(context = {}) {
        throw new Error("Not implemented");
    }
    train(trainingData) {
        return new Promise((resolve, reject) => {
            try {
                for (let oracle of this.weightedOracles) {
                    oracle.oracle.fitMany(trainingData);
                }
                resolve();
            }
            catch (error) {
                reject(error);
            }
        });
    }
}
exports.BaseWeightedBandit = BaseWeightedBandit;

},{"./MathService":5}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CosineSimilarity = exports.SampleFromProbabilityDistribution = exports.ConvertScoresToProbabilityDistribution = exports.weightedHarmonicMean = void 0;
function weightedHarmonicMean(numbers, weights) {
    if (numbers.length !== weights.length) {
        throw new Error("The length of numbers array and weights array must be the same.");
    }
    let sumWeightedValues = 0;
    let sumWeights = 0;
    for (let i = 0; i < numbers.length; i++) {
        if (numbers[i] === 0) {
            throw new Error("Cannot calculate harmonic mean when a value in the numbers array is zero.");
        }
        sumWeightedValues += weights[i] / numbers[i];
        sumWeights += weights[i];
    }
    return sumWeights / sumWeightedValues;
}
exports.weightedHarmonicMean = weightedHarmonicMean;
const ConvertScoresToProbabilityDistribution = (scores, temperature) => {
    if (scores.length === 0) {
        throw new Error("scores array must not be empty");
    }
    if (temperature <= 0) {
        throw new Error("temperature must be greater than zero");
    }
    const maxScore = Math.max(...scores);
    if (maxScore === -Infinity) {
        throw new Error("scores array must contain at least one finite number");
    }
    let probabilities = [];
    let softmaxDenominator = 0;
    const softmaxNumerators = [];
    for (let i = 0; i < scores.length; i++) {
        const score = scores[i];
        if (!Number.isFinite(score)) {
            throw new Error(`score at index ${i} must be a finite number`);
        }
        const softmaxNumerator = Math.exp(temperature * (score - maxScore));
        softmaxDenominator += softmaxNumerator;
        softmaxNumerators.push(softmaxNumerator);
    }
    for (let i = 0; i < softmaxNumerators.length; i++) {
        probabilities.push(softmaxNumerators[i] / softmaxDenominator);
    }
    return probabilities;
};
exports.ConvertScoresToProbabilityDistribution = ConvertScoresToProbabilityDistribution;
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
const CosineSimilarity = (A, B) => {
    if (!Array.isArray(A) ||
        !Array.isArray(B) ||
        !A.every(Number.isFinite) ||
        !B.every(Number.isFinite)) {
        throw new TypeError("Invalid input. Both A and B should be arrays of finite numbers.");
    }
    if (A.length !== B.length) {
        throw new Error("Arrays must have the same length");
    }
    if (A.length === 0) {
        return 0;
    }
    let dotProduct = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < A.length; i++) {
        dotProduct += A[i] * B[i];
        magA += A[i] * A[i];
        magB += B[i] * B[i];
    }
    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);
    const similarity = dotProduct / (magA * magB);
    return similarity;
};
exports.CosineSimilarity = CosineSimilarity;

},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleOracle = void 0;
const DEFAULT_PROBABILITY = 0.1;
const DEFAULT_LEARNING_RATE = 0.5;
const DEFAULT_NEGATIVE_CLASS_WEIGHT = 1.0;
class SimpleOracle {
    constructor({ actionIds = [], context = [], actionFeatures = [], learningRate = DEFAULT_LEARNING_RATE, // example default value
    contextActionIdInteractions = true, contextActionFeatureInteractions = true, useInversePropensityWeighting = true, negativeClassWeight = DEFAULT_NEGATIVE_CLASS_WEIGHT, targetLabel = "click", strictFeatures = true, weights = {}, } = {}) {
        if (!Array.isArray(actionIds) ||
            !Array.isArray(context) ||
            !Array.isArray(actionFeatures)) {
            throw new Error("actionIds, context, actionFeatures must be arrays.");
        }
        if (typeof learningRate !== "number" || learningRate <= 0) {
            throw new Error("Invalid argument: learningRate must be a positive number.");
        }
        if (typeof contextActionIdInteractions !== "boolean" ||
            typeof contextActionFeatureInteractions !== "boolean" ||
            typeof useInversePropensityWeighting !== "boolean" ||
            typeof strictFeatures !== "boolean") {
            throw new Error("contextActionIdInteractions, contextActionFeatureInteractions, useInversePropensityWeighting, strictFeatures must be booleans.");
        }
        this.addIntercept = true;
        this.setFeaturesAndUpdateWeights(actionIds, context, actionFeatures, contextActionIdInteractions, contextActionFeatureInteractions, weights);
        this.targetLabel = targetLabel;
        this.learningRate = learningRate;
        this.useInversePropensityWeighting = useInversePropensityWeighting;
        this.negativeClassWeight = negativeClassWeight;
        this.strictFeatures = strictFeatures;
    }
    getOracleState() {
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
            weights: this.getWeightsHash(),
        };
    }
    static fromOracleState(oracleState) {
        return new SimpleOracle({
            actionIds: oracleState.actionIds,
            context: oracleState.context,
            actionFeatures: oracleState.actionFeatures,
            learningRate: oracleState.learningRate,
            contextActionIdInteractions: oracleState.contextActionIdInteractions,
            contextActionFeatureInteractions: oracleState.contextActionFeatureInteractions,
            useInversePropensityWeighting: oracleState.useInversePropensityWeighting,
            negativeClassWeight: oracleState.negativeClassWeight,
            targetLabel: oracleState.targetLabel,
            strictFeatures: oracleState.strictFeatures,
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
    _getFeatures() {
        let features = [
            ...this.actionIds,
            ...this.actionFeatures,
            ...this.interactionFeatures,
        ];
        return features;
    }
    _getInteractionFeatures() {
        let interactionFeatures = [];
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
                    interactionFeatures.push(this.context[i] + "*" + this.actionFeatures[j]);
                }
            }
        }
        return interactionFeatures;
    }
    _getNFeatures() {
        if (this.addIntercept) {
            return this.features.length + 1;
        }
        else {
            return this.features.length;
        }
    }
    _zeroWeights(nFeatures) {
        return Array(nFeatures).fill(0);
    }
    _updateWeights(newWeights = {}) {
        var _a, _b;
        const combinedWeights = Object.assign({}, this.getWeightsHash(), newWeights);
        this.weights = this._zeroWeights(this._getNFeatures());
        let offset = this.addIntercept ? 1 : 0;
        if (this.addIntercept) {
            this.weights[0] = (_a = combinedWeights["intercept"]) !== null && _a !== void 0 ? _a : this.weights[0];
        }
        for (let i = 0; i < this.features.length; i++) {
            const feature = this.features[i];
            this.weights[i + offset] =
                (_b = combinedWeights[feature]) !== null && _b !== void 0 ? _b : this.weights[i + offset];
        }
        return this.weights;
    }
    setFeaturesAndUpdateWeights(actionIds, context, actionFeatures, contextActionIdInteractions, contextActionFeatureInteractions, weights = {}) {
        this.actionIds = actionIds !== null && actionIds !== void 0 ? actionIds : this.actionIds;
        this.context = context !== null && context !== void 0 ? context : this.context;
        this.actionFeatures = actionFeatures !== null && actionFeatures !== void 0 ? actionFeatures : this.actionFeatures;
        this.contextActionIdInteractions =
            contextActionIdInteractions !== null && contextActionIdInteractions !== void 0 ? contextActionIdInteractions : this.contextActionIdInteractions;
        this.contextActionFeatureInteractions =
            contextActionFeatureInteractions !== null && contextActionFeatureInteractions !== void 0 ? contextActionFeatureInteractions : this.contextActionFeatureInteractions;
        this.allInputFeatures = [...this.context, ...this.actionFeatures];
        this.interactionFeatures = this._getInteractionFeatures();
        this.features = this._getFeatures();
        this.nFeatures = this._getNFeatures();
        this.weights = this._updateWeights(weights);
    }
    getWeightsHash() {
        let result = {};
        if (this.weights == undefined) {
            return result;
        }
        if (this.addIntercept) {
            result["intercept"] = this.weights[0];
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
            result.set("intercept", Number(this.weights[0]).toFixed(round));
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
    _hashContainsAllKeys(hash, keys) {
        for (let i = 0; i < keys.length; i++) {
            if (!hash.hasOwnProperty(keys[i])) {
                return false;
            }
        }
        return true;
    }
    _addActionIdFeatures(inputsHash, actionId = undefined) {
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
    _addInteractionFeatures(inputsHash) {
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
    _getOrderedInputsArray(actionId, context = {}, actionFeatures = {}) {
        let inputsHash = Object.assign(Object.assign({}, context), actionFeatures);
        if (!this._hashContainsAllKeys(inputsHash, this.allInputFeatures)) {
            // throw error with missing features:
            const missingFeatures = [];
            this.allInputFeatures.forEach((feature) => {
                if (!inputsHash.hasOwnProperty(feature)) {
                    missingFeatures.push(feature);
                }
            });
            if (this.strictFeatures) {
                throw new Error(`Missing features in inputsHash: ${missingFeatures}`);
            }
            else {
                // add missing features with value 0:
                missingFeatures.forEach((feature) => {
                    inputsHash[feature] = 0;
                });
            }
        }
        inputsHash = this._addActionIdFeatures(inputsHash, actionId);
        inputsHash = this._addInteractionFeatures(inputsHash);
        const inputsArray = [];
        if (this.addIntercept) {
            inputsArray.push(1);
        }
        for (const feature of this.features) {
            inputsArray.push(inputsHash[feature]);
        }
        return inputsArray;
    }
    _sigmoid(z) {
        return 1 / (1 + Math.exp(-z));
    }
    _predictLogit(actionId, contextInputs = {}, actionInputs = {}) {
        const X = this._getOrderedInputsArray(actionId, contextInputs, actionInputs);
        let logit = 0;
        for (let i = 0; i < X.length; i++) {
            logit += X[i] * this.weights[i];
        }
        return logit;
    }
    predict(actionId, contextInputs = {}, actionInputs = {}) {
        const logit = this._predictLogit(actionId, contextInputs, actionInputs);
        const proba = this._sigmoid(logit);
        return proba;
    }
    fit(trainingData) {
        var _a, _b, _c;
        if (trainingData[this.targetLabel] !== undefined) {
            const X = this._getOrderedInputsArray(trainingData.actionId, (_a = trainingData.context) !== null && _a !== void 0 ? _a : {}, (_b = trainingData.actionFeatures) !== null && _b !== void 0 ? _b : {});
            const y = trainingData[this.targetLabel];
            let sampleWeight = 1;
            if (this.useInversePropensityWeighting) {
                sampleWeight = 1 / ((_c = trainingData.probability) !== null && _c !== void 0 ? _c : DEFAULT_PROBABILITY);
            }
            if (y == 0) {
                sampleWeight = sampleWeight * this.negativeClassWeight;
            }
            const pred = this._sigmoid(this._predictLogit(trainingData.actionId, trainingData.context, trainingData.actionFeatures));
            for (let i = 0; i < this.weights.length; i++) {
                const gradient = sampleWeight * this.learningRate * ((pred - y) * X[i]);
                this.weights[i] -= gradient;
            }
        }
        else {
            // Handle missing or incorrect target label
        }
    }
    fitMany(trainingDataList) {
        for (let i = 0; i < trainingDataList.length; i++) {
            this.fit(trainingDataList[i]);
        }
    }
}
exports.SimpleOracle = SimpleOracle;

},{}],7:[function(require,module,exports){
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
__exportStar(require("./Bandits"), exports);
__exportStar(require("./interfaces"), exports);
__exportStar(require("./SimpleOracle"), exports);

},{"./Bandits":3,"./SimpleOracle":6,"./interfaces":13}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import { ISimpleOracleState, FeaturesHash } from "./ISimpleOracle";
// import { SimpleOracle } from "../SimpleOracle";
// import { IRecommendation } from "./IRecommendation";
// import { ITrainingData } from "./ITrainingData";
// import { IScoredAction } from "./IAction";
// export type ISimpleBanditState = {
//   oracleState: ISimpleOracleState;
//   temperature: number;
// };
// export interface ISimpleBandit {
//   oracle: SimpleOracle;
//   temperature: number;
//   toState(): ISimpleBanditState;
//   toJSON(): string;
//   getScoredActions(context: FeaturesHash): IScoredAction[];
//   recommend(context: FeaturesHash): IRecommendation;
//   accept(recommendation: IRecommendation): Promise<ITrainingData[]>;
//   reject(recommendation: IRecommendation): Promise<ITrainingData[]>;
//   train(trainingData: ITrainingData[]): Promise<void>;
// }
// import { ISimpleOracleState, FeaturesHash } from "./ISimpleOracle";
// import { SimpleOracle } from "../SimpleOracle";
// import { IMultiRecommendation } from "./IRecommendation";
// import { ITrainingData } from "./ITrainingData";
// export type IMultiBanditState = {
//   oracleState: ISimpleOracleState;
//   temperature: number;
//   nRecommendations: number;
// };
// export interface IMultiBandit {
//   oracle: SimpleOracle;
//   temperature: number;
//   toState(): IMultiBanditState;
//   toJSON(): string;
//   recommend(context: FeaturesHash): IMultiRecommendation;
//   choose(
//     recommendation: IMultiRecommendation,
//     actionId: string | undefined,
//   ): Promise<ITrainingData[]>;
//   rejectAll(recommendation: IMultiRecommendation): Promise<ITrainingData[]>;
//   train(trainingData: ITrainingData[]): Promise<void>;
// }
// import { ISimpleOracleState, FeaturesHash } from "./ISimpleOracle";
// import { SimpleOracle } from "../SimpleOracle";
// import { IRecommendation, IMultiRecommendation } from "./IRecommendation";
// import { ITrainingData } from "./ITrainingData";
// import { IScoredAction } from "./IAction";
// export type WeightedOracle = { oracle: SimpleOracle; weight: number };
// export type WeightedOracleState = {
//   oracleState: ISimpleOracleState;
//   weight: number;
// };
// export type IWeightedMultiBanditState = {
//   oraclesStates: WeightedOracleState[];
//   temperature: number;
//   nRecommendations: number;
// };
// export interface IWeightedMultiBandit {
//   weightedOracles: WeightedOracle[];
//   temperature: number;
//   getWeightedMultiBanditState(): IWeightedMultiBanditState;
//   toJSON(): string;
//   getScoredActions(context: FeaturesHash): IRecommendedAction[]
//   getActionScoresPerOracle(
//     context: FeaturesHash
//   ): Array<{ [key: string]: number | string }>;
//   recommend(context: FeaturesHash): IMultiRecommendation;
//   choose(
//     recommendation: IMultiRecommendation,
//     actionId: string | undefined
//   ): Promise<ITrainingData[]>;
//   rejectAll(recommendation: IMultiRecommendation): Promise<ITrainingData[]>;
//   feedback(
//     recommendation: IMultiRecommendation,
//     actionId: string,
//     label: string,
//     value: number
//   ): Promise<ITrainingData[]>;
//   train(trainingData: ITrainingData[]): Promise<void>;
// }
// export type IWeightedBanditState = {
//   oraclesStates: WeightedOracleState[];
//   temperature: number;
// };
// export interface IWeightedBandit {
//   weightedOracles: WeightedOracle[];
//   temperature: number;
//   getWeightedBanditState(): IWeightedBanditState;
//   toJSON(): string;
//   getScoredActions(context: FeaturesHash): IScoredAction[];
//   getActionScoresPerOracle(
//     context: FeaturesHash
//   ): Array<{ [key: string]: number | string }>;
//   recommend(context: FeaturesHash): IRecommendation;
//   accept(recommendation: IRecommendation): Promise<ITrainingData[]>;
//   reject(recommendation: IRecommendation): Promise<ITrainingData[]>;
//   feedback(
//     recommendation: IRecommendation,
//     label: string,
//     value: number
//   ): Promise<ITrainingData[]>;
//   train(trainingData: ITrainingData[]): Promise<void>;
// }

},{}],10:[function(require,module,exports){
arguments[4][8][0].apply(exports,arguments)
},{"dup":8}],11:[function(require,module,exports){
arguments[4][8][0].apply(exports,arguments)
},{"dup":8}],12:[function(require,module,exports){
arguments[4][8][0].apply(exports,arguments)
},{"dup":8}],13:[function(require,module,exports){
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
__exportStar(require("./IRecommendation"), exports);
__exportStar(require("./IAction"), exports);
__exportStar(require("./IBandits"), exports);
__exportStar(require("./ITrainingData"), exports);
__exportStar(require("./ISimpleOracle"), exports);

},{"./IAction":8,"./IBandits":9,"./IRecommendation":10,"./ISimpleOracle":11,"./ITrainingData":12}]},{},[1]);
