import React, { useState, useEffect } from "react";
import { SimpleBandit, SimpleOracle } from "../dist/cjs/index";

function ContextFruitBandit() {
  const [bandit, setBandit] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [context, setContext] = useState({ sunny: 1 });
  const [scoredActions, setScoredActions] = useState([]);
  const [trainingData, setTrainingData] = useState([]);
  const [serializedBandit, setSerializedBandit] = useState("");

  useEffect(() => {
    const banditInstance = new SimpleBandit({
      oracle: new SimpleOracle({
        learningRate: 0.1,
        actionIdFeatures: false, // only learn interactions with context
        actionFeatures: false, // only learn interactions with context
        contextActionIdInteractions: false, // only learn feature interactions with context
      }),
      actions: {
        apple: { fruit: 1, treat: -1 },
        pear: { fruit: 1, treat: -1 },
        orange: { fruit: 1, treat: -1 },
        chocolate: { fruit: -1, treat: 1 },
        candy: { fruit: -1, treat: 1 },
        cake: { fruit: -1, treat: 1 },
      },
      temperature: 0.3,
    });
    setBandit(banditInstance);
  }, []);

  useEffect(() => {
    if (bandit) {
      generateNewRecommendation();
    }
  }, [bandit]);

  const randomWeather = () => {
    const context = [{ sunny: 1 }, { rainy: 1 }][Math.floor(Math.random() * 2)];
    setContext(context);
    const _scoredActions = bandit.getScoredActions(context);
    _scoredActions.forEach((scoredAction) => {
      const actionFeatures = bandit.actionsMap[scoredAction.actionId].features;
      scoredAction.fruit = actionFeatures.fruit || 0;
      scoredAction.treat = actionFeatures.treat || 0;
    });
    setScoredActions(_scoredActions);
    return context;
  };

  const generateNewRecommendation = () => {
    const newContext = randomWeather();
    setRecommendation(bandit.recommend(newContext));
  };

  const handleAccept = async () => {
    const newTrainingData = await bandit.accept(recommendation);
    setTrainingData([...trainingData, ...newTrainingData]);
    setSerializedBandit(bandit.toJSON());
    generateNewRecommendation();
  };

  const handleReject = async () => {
    const newTrainingData = await bandit.reject(recommendation);
    setTrainingData([...trainingData, ...newTrainingData]);
    setSerializedBandit(bandit.toJSON());
    generateNewRecommendation();
  };

  return (
    <div>
      <h1>Context dependent recommendations</h1>
      <p>
        The recommender is only learning an interaction between the context
        (sunny or rainy) and the fruit or treat preferences.
      </p>
      <h2>Actions scores and probabilities:</h2>
      <div>
        <table>
          <thead>
            <tr>
              <th>actionId</th>
              <th>fruit</th>
              <th>treat</th>
              <th>score</th>
              <th>probability</th>
            </tr>
          </thead>
          <tbody>
            {scoredActions.map((scoredAction, index) => (
              <tr key={index}>
                <td>{scoredAction.actionId}</td>
                <td>{scoredAction.fruit}</td>
                <td>{scoredAction.treat}</td>
                <td>{scoredAction.score?.toFixed(2)}</td>
                <td>{(scoredAction.probability * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>Context:</h2>
      <div>
        <button
          onClick={() => {
            generateNewRecommendation();
          }}
        >
          Generate Random Weather
        </button>{" "}
        <div>{context?.sunny == 1 ? "sunny" : "rainy"}</div>
      </div>
      <h2>Food recommendation:</h2>
      <div>
        <p>
          You can try only eating fruit when it's sunny and only treats when
          it's rainy. Then see how fast the algorithm learns your context
          dependent preference.
        </p>
      </div>{" "}
      {recommendation && <div>{recommendation.actionId}</div>}
      <button onClick={handleAccept}>Eat</button>
      <button onClick={handleReject}>Don't eat</button>
      <h2>Training Data</h2>
      <div>{JSON.stringify(trainingData)}</div>
      <h2>JSON serialized bandit</h2>
      <div>{serializedBandit}</div>
    </div>
  );
}

export default ContextFruitBandit;
