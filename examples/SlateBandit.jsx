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
        apple: { fruit: 1, treat: -1 },
        pear: { fruit: 1, treat: -1 },
        orange: { fruit: 1, treat: -1 },
        chocolate: { fruit: -1, treat: 1 },
        candy: { fruit: -1, treat: 1 },
        cake: { fruit: -1, treat: 1 },
      },
      temperature: 0.2,
      slateSize: slateSize,
      slateNegativeSampleWeight: 0.5,
    });
    banditInstance.train(trainingData);
    setSerializedBandit(banditInstance.toJSON());
    setBandit(banditInstance);
  }, [slateSize]);

  useEffect(() => {
    if (bandit) {
      generateNewRecommendation();
    }
  }, [bandit, slateSize]);

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

  const handleReset = () => {
    setTrainingData([]);
    setSlateSize(3);
  };

  return (
    <div>
      <h3>Slate of multiple recommendations</h3>
      <p>
        The slate of items gets randomly sampled one by one from top to bottom,
        according to the oracle probabilties.
      </p>

      <h3>Actions scores and probabilities</h3>
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

      <h3>Slate</h3>
      <h4>slateSize</h4>
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
      <p>
        By choosing one item you also reject the other items in the slate. You
        can see that we generate a trainingData for each item in the slate.
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
      <h3>Training Data</h3>
      <div>{JSON.stringify(trainingData)}</div>
      <h3>JSON serialized bandit</h3>
      <div>{serializedBandit}</div>
      <button onClick={handleReset}>Reset</button>
    </div>
  );
}

export default SlateFruitBandit;
