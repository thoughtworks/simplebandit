import React, { useState, useEffect } from 'react';
import { SimpleBandit, SimpleOracle } from "../../dist/index";

function TemperatureFruitBandit() {
  const [bandit, setBandit] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [scoredActions, setScoredActions] = useState([]);
  const [trainingData, setTrainingData] = useState([]);
  const [serializedBandit, setSerializedBandit] = useState("");
  const [learningRate, setLearningRate] = useState(0.1);
  const [temperature, setTemperature] = useState(0.2);

  useEffect(() => {
    const banditInstance = new SimpleBandit({
      oracles: new SimpleOracle({learningRate: learningRate}),
      actions: ["apple", "pear", "orange"],
      temperature: temperature,
    });
    setBandit(banditInstance);
  }, []);

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
      <p>This example shows the underlying scores per actionId (fruit), the generated training data, and the serialized bandit state. </p>
      <p>You can adjust the learning rate of the oracle, and the temperature of the bandit. </p>
      <h2>Learning Rate:</h2>
      <input type="number" value={learningRate} step="0.1" onChange={(e) => setLearningRate(parseFloat(e.target.value))} />
      <h2>Temperature:</h2>
      <input type="number" value={temperature} step="0.1" onChange={(e) => setTemperature(parseFloat(e.target.value))} />
      <h2>Actions scores and probabilities:</h2>
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
      <div>{JSON.stringify(trainingData)}</div>
      <h2>JSON serialized bandit</h2>
      <div>{serializedBandit}</div>
    </div>
  );
}

export default TemperatureFruitBandit;