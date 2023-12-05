import React, { useState, useEffect } from "react";
import { SimpleBandit, SimpleOracle } from "../dist/cjs/index";

function TemperatureFruitBandit() {
  const [bandit, setBandit] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [scoredActions, setScoredActions] = useState([]);
  const [trainingData, setTrainingData] = useState([]);
  const [serializedBandit, setSerializedBandit] = useState("");
  const [learningRate, setLearningRate] = useState(0.1);
  const [temperature, setTemperature] = useState(0.1);

  useEffect(() => {
    let oldWeights = bandit ? { ...bandit.oracle[0].weights } : {};
    const banditInstance = new SimpleBandit({
      oracle: new SimpleOracle({
        learningRate: learningRate,
        weights: oldWeights,
      }),
      actions: ["apple", "pear", "orange"],
      temperature: temperature,
    });
    setBandit(banditInstance);
  }, [temperature, learningRate]);

  useEffect(() => {
    if (bandit) {
      generateNewRecommendation();
    }
  }, [bandit]);

  const generateNewRecommendation = () => {
    setRecommendation(bandit.recommend());
    setScoredActions(bandit.getScoredActions());
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
      <h1>Adjusting the Fruit Bandit</h1>
      <p>
        In this example you can adjust the learning rate of the oracle, and the
        temperature of the bandit. The learning rate determines how quickly the
        weights of the oracle adjust, and so how quickly the bandit learns and
        forgets. The temperature determines how much the bandit explores versus
        exploits.
      </p>

      <h2>Learning Rate:</h2>
      <input
        id="learningRateSlider"
        type="range"
        min="0.01"
        max="1.00"
        value={learningRate}
        step="0.01"
        onChange={(e) => setLearningRate(parseFloat(e.target.value))}
      />
      <label htmlFor="learningRateSlider">{learningRate.toFixed(2)}</label>
      <h2>Temperature:</h2>
      <input
        id="temperatureSlider"
        type="range"
        min="0.00"
        max="1.00"
        value={temperature}
        step="0.01"
        onChange={(e) => setTemperature(parseFloat(e.target.value))}
      />
      <label htmlFor="temperatureSlider">{temperature.toFixed(2)}</label>
      <h2>Actions scores and probabilities:</h2>
      <p>
        Here we see underlying scores per actionId (fruit), and the resulting
        sampling probabilities depending on the temperature.{" "}
      </p>
      <p>
        The lower the temperature the higher the probability for the highest
        scoring actions (exploiting). The higher the temperature the more even
        low scoring actions have a chance (exploring).
      </p>
      <div>
        <table>
          <thead>
            <tr>
              <th>actionId</th>
              <th>score</th>
              <th>probability</th>
            </tr>
          </thead>
          <tbody>
            {scoredActions.map((scoredAction, index) => (
              <tr key={index}>
                <td>{scoredAction.actionId}</td>
                <td>{scoredAction.score?.toFixed(2)}</td>
                <td>{(scoredAction.probability * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>Recommended fruit:</h2>
      {recommendation && <div>{recommendation.actionId}</div>}
      <button onClick={handleAccept}>Accept</button>
      <button onClick={handleReject}>Reject</button>
      <h2>Training Data</h2>
      <p>
        You can see the training data that is generated by accepting and
        rejecting recommndations. You can refit the bandit with this data.
      </p>
      <div>{JSON.stringify(trainingData)}</div>
      <h2>JSON serialized bandit</h2>
      <p>You can serialize the bandit to JSON and then rehydrate it later.</p>
      <div>{serializedBandit}</div>
    </div>
  );
}

export default TemperatureFruitBandit;
