import React, { useState, useEffect } from "react";
import { SimpleBandit, SimpleOracle } from "../../dist/index";

function SlateFruitBandit() {
  const [bandit, setBandit] = useState(null);
  const [slate, setSlate] = useState(null);
  const [scoredActions, setScoredActions] = useState([]);
  const [trainingData, setTrainingData] = useState([]);
  const [serializedBandit, setSerializedBandit] = useState("");

  useEffect(() => {
    const banditInstance = new SimpleBandit({
      oracle: new SimpleOracle({ learningRate: 0.1 }),
      actions: {
        apple: { fruit: 1 },
        pear: ["fruit"], // equivalent: sets fruit:1
        orange: { fruit: 1 },
        chocolate: { treat: 1 },
        candy: ["treat"], // equivalent: sets treat:1
        cake: { treat: 1 },
      },
      temperature: 0.2,
      slateSize: 3,
    });
    setBandit(banditInstance);
  }, []);

  useEffect(() => {
    if (bandit) {
      generateNewRecommendation();
    }
  }, [bandit]);

  const generateNewRecommendation = () => {
    setSlate(bandit.slate());
    const _scoredActions = bandit.getScoredActions();
    _scoredActions.forEach((scoredAction) => {
      const actionFeatures = bandit.actionsMap[scoredAction.actionId].features;
      scoredAction.fruit = actionFeatures.fruit || 0;
      scoredAction.treat = actionFeatures.treat || 0;
    });
    setScoredActions(_scoredActions);
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
      <h1>Slate of multiple recommendations</h1>
      <p>The slate items get sampled one by one from top to bottom.</p>
      <p>
        The recommender is both learning preference for specific items and
        preferences for fruits or treats in general.
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

export default SlateFruitBandit;
