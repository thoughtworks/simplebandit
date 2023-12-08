import React, { useState, useEffect } from "react";
import { SimpleBandit, SimpleOracle } from "../dist/cjs/index";

function SlateFruitBandit() {
  const [bandit, setBandit] = useState(null);
  const [slate, setSlate] = useState(null);
  const [slateSize, setSlateSize] = useState(3);
  const [scoredActions, setScoredActions] = useState([]);
  const [trainingData, setTrainingData] = useState([]);
  const [serializedBandit, setSerializedBandit] = useState("");

  useEffect(() => {
    const banditInstance = new SimpleBandit({
      oracle: new SimpleOracle({ learningRate: 0.05 }),
      actions: {
        apple: { fruit: 1 },
        pear: ["fruit"], // equivalent to { fruit:1 }
        orange: { fruit: 1 },
        chocolate: { treat: 1 },
        candy: { treat: 1 },
        cake: { treat: 1 },
      },
      temperature: 0.2,
      slateSize: 3,
      slateNegativeSampleWeight: 0.5,
    });
    setBandit(banditInstance);
  }, []);

  useEffect(() => {
    if (bandit) {
      generateNewRecommendation();
    }
  }, [bandit, slateSize]);

  const generateNewRecommendation = () => {
    setSlate(bandit.slate({}, { slateSize: slateSize }));
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

      <h2>Actions scores and probabilities:</h2>
      <p>
        This slate recommender is both learning preference for specific items
        and preferences for fruits or treats in general. By choosing a fruit,
        all fruits go up in probability.
      </p>
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
      <h2>slateSize:</h2>
      <label htmlFor="weightSlider">1</label>
      <input
        id="slateSizeSlider"
        type="range"
        min="1"
        max="6"
        value={slateSize}
        step="1"
        onChange={(e) => {
          setSlateSize(parseInt(e.target.value));
        }}
      />
      <label htmlFor="weightSlider">6</label>
      <h2>Recommended fruits:</h2>
      <p>
        By selecting one item it will go up in probability, but you also reject
        the others and they will go down in probability.
      </p>
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
