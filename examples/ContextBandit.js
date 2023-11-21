import React, { useState, useEffect } from "react";
import { SimpleBandit, SimpleOracle } from "../dist/index";

function ContextFruitBandit() {
  const [bandit, setBandit] = useState(null);
  const [slate, setSlate] = useState(null);
  const [context, setContext] = useState(null);
  const [scoredActions, setScoredActions] = useState([]);
  const [trainingData, setTrainingData] = useState([]);
  const [serializedBandit, setSerializedBandit] = useState("");

  useEffect(() => {
    const banditInstance = new SimpleBandit({
      oracle: new SimpleOracle({ learningRate: 0.1 }),
      actions: {
        apple: { fruit: 1 },
        pear: { fruit: 1 },
        orange: { fruit: 1 },
        chocolate: { treat: 1 },
        candy: { treat: 1 },
        cake: { treat: 1 },
      },
      temperature: 0.1,
      slateSize: 3,
    });
    setBandit(banditInstance);
  }, []);

  useEffect(() => {
    if (bandit) {
      generateNewRecommendation();
    }
  }, [bandit]);

  const randomWeather = () => {
    const weather = ["sunny", "rainy"][Math.floor(Math.random() * 2)];
    const context = weather == "sunny" ? { sunny: 1 } : { sunny: -1 };
    setContext(context);
    const _scoredActions = bandit.getScoredActions(context);
    _scoredActions.forEach((scoredAction) => {
      const actionFeatures = bandit.actionsMap[scoredAction.actionId].features;
      scoredAction.fruit = actionFeatures.fruit || 0;
      scoredAction.treat = actionFeatures.treat || 0;
    });
    setScoredActions(_scoredActions);
  };

  const generateNewRecommendation = () => {
    randomWeather();
    setSlate(bandit.slate(context));
  };

  const handleChoose = async (index) => {
    const newTrainingData = await bandit.choose(
      slate,
      slate.slateItems[index].actionId,
    );
    setTrainingData([...trainingData, ...newTrainingData]);
    setSerializedBandit(bandit.toJSON());
    generateNewRecommendation();
  };

  const handleReject = async () => {
    const newTrainingData = await bandit.reject(slate);
    setTrainingData([...trainingData, ...newTrainingData]);
    setSerializedBandit(bandit.toJSON());
    generateNewRecommendation();
  };

  return (
    <div>
      <h1>Context dependent recommendations</h1>
      <p>
        The recommender is both learning an interaction between the context
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
      <div>{context?.sunny == 1 ? "sunny" : "rainy"}</div>
      <div>
        <button
          onClick={() => {
            randomWeather();
            generateNewRecommendation();
          }}
        >
          RandomWeather
        </button>{" "}
      </div>
      <h2>Recommended fruits:</h2>
      {slate &&
        slate.slateItems.map((action, index) => (
          <div
            key={action.actionId}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "start",
            }}
          >
            {index + 1}: {action.actionId}
            <button onClick={() => handleChoose(index)}>Choose</button>
          </div>
        ))}
      <button onClick={handleReject}>Reject all</button>
      <h2>Training Data</h2>
      <div>{JSON.stringify(trainingData)}</div>
      <h2>JSON serialized bandit</h2>
      <div>{serializedBandit}</div>
    </div>
  );
}

export default ContextFruitBandit;
