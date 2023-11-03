"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleBandit = void 0;
const MathService_1 = require("./MathService");
const BanditOracle_1 = require("./BanditOracle");
class SimpleBandit {
    constructor(oracle, actions, temperature = 1, nRecommendations = 1) {
        this.oracle = oracle;
        this.actions = actions.reduce((acc, obj) => {
            acc[obj.ActionId] = obj;
            return acc;
        }, {});
        this.temperature = temperature;
        this.nRecommendations = nRecommendations;
    }
    static fromContextAndActions(context, actions, temperature = 1, nRecommendations = 1) {
        const actionFeatures = [...new Set(actions.flatMap((action) => Object.keys(action.Features)))];
        const actionIds = actions.map((action) => action.ActionId);
        const banditOracle = new BanditOracle_1.BanditOracle(context, actionFeatures, actionIds);
        return new SimpleBandit(banditOracle, actions, temperature, nRecommendations);
    }
    static fromActions(actions, temperature = 1, nRecommendations = 1) {
        const actionFeatures = [...new Set(actions.flatMap((action) => Object.keys(action.Features)))];
        const actionIds = actions.map((action) => action.ActionId);
        const banditOracle = new BanditOracle_1.BanditOracle(actionIds, [], actionFeatures);
        return new SimpleBandit(banditOracle, actions, temperature, nRecommendations);
    }
    static fromActionIds(actionsIds, temperature = 1, nRecommendations = 1) {
        const actions = actionsIds.map((actionId) => ({
            ActionId: actionId,
            Features: {},
        }));
        return SimpleBandit.fromActions(actions, temperature, nRecommendations);
    }
    static fromJSON(json, actions) {
        const state = JSON.parse(json);
        return SimpleBandit.fromRecommendationEngineState(state, actions);
    }
    static fromRecommendationEngineState(state, actions) {
        const banditOracle = BanditOracle_1.BanditOracle.fromOracleState(state.oracleState);
        const temperature = state.temperature;
        const nRecommendations = state.nRecommendations;
        return new SimpleBandit(banditOracle, actions, temperature, nRecommendations);
    }
    getRecommendationEngineState() {
        return {
            oracleState: this.oracle.getOracleState(),
            temperature: this.temperature,
            nRecommendations: this.nRecommendations,
        };
    }
    toJSON() {
        return JSON.stringify(this.getRecommendationEngineState());
    }
    _sampleFromActionScores(actionScores) {
        const scores = actionScores.map((ex) => ex.score);
        const probabilities = (0, MathService_1.ConvertScoresToProbabilityDistribution)(scores, this.temperature);
        const sampleIndex = (0, MathService_1.SampleFromProbabilityDistribution)(probabilities);
        return sampleIndex;
    }
    makeRecommendation(context = {}) {
        let scoredActions = [];
        const actionIds = Object.keys(this.actions);
        for (let i = 0; i < actionIds.length; i++) {
            const actionId = actionIds[i];
            const action = this.actions[actionId];
            const actionScore = this.oracle.predict(context, action.Features, action.ActionId);
            const softmaxNumerator = Math.exp(this.temperature * actionScore);
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
    _generateOracleTrainingData(recommendation, selectedActionId = undefined) {
        let trainingData = [];
        for (let index = 0; index < recommendation.recommendedActions.length; index++) {
            const actionId = recommendation.recommendedActions[index].actionId;
            const recommendedAction = this.actions[actionId];
            if (!recommendedAction) {
                throw new Error(`Failed to generate training data for recommended exercise at index ${index}.`);
            }
            const context = recommendation.context;
            const actionFeatures = recommendedAction.Features;
            const label = recommendedAction.ActionId === selectedActionId ? 1 : 0;
            const probability = recommendation.recommendedActions[index].probability;
            trainingData.push({ actionId, actionFeatures, context probability });
        }
        return trainingData;
    }
    chooseAction(recommendation, actionId) {
        return new Promise((resolve, reject) => {
            try {
                const trainingData = this._generateOracleTrainingData(recommendation, actionId);
                this.oracle.fitMany(trainingData);
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
                this.oracle.fitMany(trainingData);
                resolve();
            }
            catch (error) {
                reject(error);
            }
        });
    }
}
exports.SimpleBandit = SimpleBandit;
