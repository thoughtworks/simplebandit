import React, { useState, useEffect } from "react";
import { SimpleBandit, SimpleOracle } from "../dist/index";

function WeightedFruitBandit() {
  const [bandit, setBandit] = useState(null);
  const [slate, setSlate] = useState(null);
  const [ScoredActionPerOracle, setScoredActionPerOracle] = useState([[]]);
  const [trainingData, setTrainingData] = useState([]);
  const [serializedBandit, setSerializedBandit] = useState("");
  const [clickWeight, setClickWeight] = useState(0.5);
  const [selectedAction, setSelectedAction] = useState(null);
  const [starRating, setStarRating] = useState(null);

  useEffect(() => {
    let oldClickOracleWeights = bandit ? { ...bandit.oracle[0].weights } : {};
    const clickOracle = new SimpleOracle({
      learningRate: 0.5,
      targetLabel: "click",
      oracleWeight: clickWeight,
      weights: oldClickOracleWeights,
    });

    let oldStarsOracleWeights = bandit ? { ...bandit.oracle[1].weights } : {};
    const starsOracle = new SimpleOracle({
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
      temperature: 0.1,
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
    const slate = bandit.slate();
    setSlate(slate);
    const scoredActionPerOracle = bandit.getScoredActionsPerOracle();
    setScoredActionPerOracle(scoredActionPerOracle);
  };

  const handleSubmit = async () => {
    const newClickTrainingData = await bandit.choose(slate, selectedAction);
    const newStarsTrainingData = await bandit.feedback(
      slate,
      "stars",
      starRating,
      selectedAction,
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

  const handleWeightChange = (newWeight) => {
    setClickWeight(newWeight);
  };

  return (
    <div>
      <h1>Weighted oracles</h1>
      <p>
        This is an example of a bandit that combines two scores: a click score
        and a star rating score. You can select which to weight more for the
        final score and recommendation.
      </p>

      <h2>Oracle Weights:</h2>
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

      <h2>Scored Actions Per Oracle:</h2>
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
            <button
              onClick={() => {
                setSelectedAction(action.actionId);
                setStarRating(null);
              }}
            >
              Select
            </button>
            {selectedAction === action.actionId && (
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
                    handleSubmit();
                  }}
                >
                  Submit
                </button>
              </div>
            )}
          </div>
        ))}
      <h2>Training Data</h2>
      <div>{JSON.stringify(trainingData)}</div>
      <h2>JSON serialized bandit</h2>
      <div>{serializedBandit}</div>
    </div>
  );
}

export default WeightedFruitBandit;
