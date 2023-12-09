import React, { useState, useEffect } from "react";
import { SimpleBandit, SimpleOracle } from "../dist/cjs/index";

function WeightedFruitBandit() {
  const [bandit, setBandit] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [ScoredActionPerOracle, setScoredActionPerOracle] = useState([[]]);
  const [trainingData, setTrainingData] = useState([]);
  const [serializedBandit, setSerializedBandit] = useState("");
  const [clickWeight, setClickWeight] = useState(0.5);
  const [selectedAction, setSelectedAction] = useState(null);
  const [starRating, setStarRating] = useState(null);

  useEffect(() => {
    let oldClickOracleWeights = bandit ? { ...bandit.oracle[0].weights } : {};
    const clickOracle = new SimpleOracle({
      learningRate: 0.1,
      targetLabel: "click",
      oracleWeight: clickWeight,
      weights: oldClickOracleWeights,
    });

    let oldStarsOracleWeights = bandit ? { ...bandit.oracle[1].weights } : {};
    const starsOracle = new SimpleOracle({
      learningRate: 0.1,
      targetLabel: "stars",
      oracleWeight: 1 - clickWeight,
      weights: oldStarsOracleWeights,
    });

    const banditInstance = new SimpleBandit({
      oracle: [clickOracle, starsOracle],
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
    setSerializedBandit(bandit ? bandit.toJSON() : "");
  }, [clickWeight]);

  useEffect(() => {
    if (bandit) {
      generateNewRecommendation();
    }
  }, [bandit]);

  const generateNewRecommendation = () => {
    setRecommendation(bandit.recommend());
    setScoredActionPerOracle(bandit.getScoredActionsPerOracle());
  };

  const handleAccept = async () => {
    const newClickTrainingData = await bandit.accept(recommendation);
    const newStarsTrainingData = await bandit.feedback(
      recommendation,
      "stars",
      starRating,
    );
    setTrainingData([
      ...trainingData,
      ...newClickTrainingData,
      ...newStarsTrainingData,
    ]);
    setSerializedBandit(bandit.toJSON());
    setSelectedAction(null);
    setStarRating(null);
    generateNewRecommendation();
  };

  const handleReject = async () => {
    const newClickTrainingData = await bandit.reject(recommendation);
    setTrainingData([...trainingData, ...newClickTrainingData]);
    setSerializedBandit(bandit.toJSON());
    setSelectedAction(null);
    setStarRating(null);
    generateNewRecommendation();
  };

  const handleWeightChange = (newWeight) => {
    setClickWeight(newWeight);
  };

  return (
    <div>
      <h3>Weighted oracles</h3>
      <p>
        This is an example of a bandit that combines two oracles: one oracle for
        click scores and one oracle for star ratings.
      </p>

      <h3>Oracle Weights:</h3>
      <p>
        You can select to put more weight on star oracle or on the click oracle.
      </p>
      <label htmlFor="weightSlider">Stars</label>
      <input
        id="weightSlider"
        type="range"
        min="0.00"
        max="1.00"
        value={clickWeight}
        step="0.01"
        onChange={(e) => {
          handleWeightChange(parseFloat(e.target.value));
        }}
      />
      <label htmlFor="weightSlider">Clicks</label>

      <h3>Scored Actions Per Oracle:</h3>
      <div>
        <table>
          <thead>
            <tr>
              <th>actionId</th>
              <th>clickScore</th>
              <th>starsScore</th>
              <th>weightedScore</th>
              <th>probability</th>
            </tr>
          </thead>
          <tbody>
            {ScoredActionPerOracle.map((scoredAction, index) => (
              <tr key={index}>
                <td>{scoredAction.actionId}</td>
                <td>{scoredAction.click?.toFixed(2)}</td>
                <td>{scoredAction.stars?.toFixed(2)}</td>
                <td>{scoredAction.weightedScore?.toFixed(2)}</td>
                <td>{(scoredAction.probability * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>Recommended foods:</h3>
      <p>
        You can try to e.g. mostly accept fruits but give them low rating, and
        mostly reject treats but when you do accept give them a high rating.
        Then play with the weight slider to see how that affects the
        recommendations probabilities.
      </p>
      {recommendation && (
        <div>
          <b>{recommendation.actionId}</b>
        </div>
      )}
      <button
        onClick={() => {
          setSelectedAction(recommendation.actionId);
          setStarRating(null);
        }}
      >
        Eat
      </button>
      {selectedAction !== null && (
        <div>
          Stars:
          <select
            value=""
            onChange={(e) => {
              setStarRating(parseFloat(e.target.value));
            }}
          >
            <option value="" disabled={true}>
              Select rating
            </option>
            <option value="0.0">1</option>
            <option value="0.25">2</option>
            <option value="0.5">3</option>
            <option value="0.75">4</option>
            <option value="1.0">5</option>
          </select>
          <button
            disabled={starRating === null}
            onClick={() => {
              handleAccept();
            }}
          >
            Submit
          </button>
        </div>
      )}
      <button
        onClick={() => {
          handleReject();
        }}
      >
        Don't eat
      </button>
      <h3>Training Data</h3>
      <div>{JSON.stringify(trainingData)}</div>
      <h3>JSON serialized bandit</h3>
      <div>{serializedBandit}</div>
    </div>
  );
}

export default WeightedFruitBandit;
