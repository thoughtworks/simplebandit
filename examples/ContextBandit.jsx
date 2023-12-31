import React, { useState, useEffect } from "react";
import { SimpleBandit, SimpleOracle } from "../dist/cjs/index";

function ContextFruitBandit() {
  const [bandit, setBandit] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [context, setContext] = useState({ sunny: 1 });
  const [scoredActions, setScoredActions] = useState([]);
  const [trainingData, setTrainingData] = useState([]);
  const [serializedBandit, setSerializedBandit] = useState("");
  const [actionIdFeatures, setActionIdFeatures] = useState(true);
  const [actionFeatures, setActionFeatures] = useState(true);
  const [contextActionIdInteractions, setContextActionIdInteractions] =
    useState(true);
  const [
    contextActionFeatureInteractions,
    setContextActionFeatureInteractions,
  ] = useState(true);

  useEffect(() => {
    const banditInstance = new SimpleBandit({
      oracle: new SimpleOracle({
        learningRate: 0.1,
        actionIdFeatures: actionIdFeatures, // only learn interactions with context
        actionFeatures: actionFeatures, // only learn interactions with context
        contextActionIdInteractions: contextActionIdInteractions, // only learn feature interactions with context
        contextActionFeatureInteractions: contextActionFeatureInteractions, // learn feature interactions with context and actions
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
    async function train() {
      await banditInstance.train(trainingData);
      setSerializedBandit(banditInstance.toJSON());
      setBandit(banditInstance);
    }
    train();
  }, [
    actionIdFeatures,
    actionFeatures,
    contextActionIdInteractions,
    contextActionFeatureInteractions,
  ]);

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

  const HandleReset = () => {
    setTrainingData([]);
    setActionIdFeatures(true);
    setActionFeatures(true);
    setContextActionIdInteractions(true);
    setContextActionFeatureInteractions(true);
  };

  return (
    <div>
      <h3>Context dependent recommendations</h3>
      <ul>
        <li>
          The bandit can learn the interaction between the context (sunny or
          rainy) and the fruit or treat preferences.
        </li>
        <li>
          If you switch off the context interaction toggles, the recommendations
          will no longer depend on the weather.
        </li>
        <li>
          If you switch off the actionIdFeatures and
          contextActionIdInteractions, the recommendations will no longer depend
          on the specific actionId ('apple, 'pear', etc), but the probabilities
          will be the same for all fruits and all treats.
        </li>
        <li>
          If you switch off all toggles, all actionIds get the same score and so
          the same probability.
        </li>
        <li>
          Each time you change a toggle, the bandit gets reinstantiated and
          retrained on the existing training data. You can see the newly fitted
          coefficients in the JSON serialized bandit.
        </li>
      </ul>
      <div>
        <label style={{ display: "block", marginBottom: "10px" }}>
          <input
            type="checkbox"
            name="actionIdFeatures"
            onChange={(e) => setActionIdFeatures(e.target.checked)}
            checked={actionIdFeatures}
          />
          ActionIdFeatures
          <span style={{ marginLeft: "20px", fontStyle: "italic" }}>
            Toggle the use of actionIds as features (e.g. 'apple', 'chocolate',
            etc).
          </span>
        </label>
        <label style={{ display: "block", marginBottom: "10px" }}>
          <input
            type="checkbox"
            name="actionFeatures"
            onChange={(e) => setActionFeatures(e.target.checked)}
            checked={actionFeatures}
          />
          ActionFeatures
          <span style={{ marginLeft: "20px", fontStyle: "italic" }}>
            Toggle the use of actionFeatures (i.e. 'fruit' and 'treat').
          </span>
        </label>
        <label style={{ display: "block", marginBottom: "10px" }}>
          <input
            type="checkbox"
            name="contextActionIdInteractions"
            onChange={(e) => setContextActionIdInteractions(e.target.checked)}
            checked={contextActionIdInteractions}
          />
          ContextActionIdInteractions
          <span style={{ marginLeft: "20px", fontStyle: "italic" }}>
            Toggle the interactions between context and actionId (e.g.
            'rainy*apple', 'sunny*chocolate', etc).
          </span>
        </label>
        <label style={{ display: "block", marginBottom: "10px" }}>
          <input
            type="checkbox"
            name="contextActionFeatureInteractions"
            onChange={(e) =>
              setContextActionFeatureInteractions(e.target.checked)
            }
            checked={contextActionFeatureInteractions}
          />
          ContextActionFeatureInteractions
          <span style={{ marginLeft: "20px", fontStyle: "italic" }}>
            Toggle the interaction between context and actionFeatures (e.g.
            'rainy*fruit', 'sunny*treat').
          </span>
        </label>
      </div>
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
      <h3>Context</h3>
      <p>
        After each recommendation we get a new random context/weather (sunny or
        rainy).
      </p>
      <p>
        You can also click the button to generate a new random context/weather,
        and see how that affects the recommendations.
      </p>
      <div>
        <div>
          <b>{context?.sunny == 1 ? "sunny" : "rainy"}</b>
        </div>
        <button
          onClick={() => {
            generateNewRecommendation();
          }}
        >
          Randomize Context/Weather
        </button>{" "}
      </div>
      <h3>Food recommendation</h3>
      <div>
        <p>
          You can try only eating fruit when it's sunny and only treats when
          it's rainy. Then see how fast the algorithm learns your context
          dependent preference.
        </p>
        <p>
          Then switch on and off the toggles to see how that affects the
          recommendations.
        </p>
      </div>{" "}
      {recommendation && (
        <div>
          <b>{recommendation.actionId}</b>
        </div>
      )}
      <button onClick={handleAccept}>Eat</button>
      <button onClick={handleReject}>Don't eat</button>
      <h3>Training Data</h3>
      <div>{JSON.stringify(trainingData)}</div>
      <h3>JSON serialized bandit</h3>
      <div>{serializedBandit}</div>
      <button onClick={HandleReset}>Reset</button>
    </div>
  );
}

export default ContextFruitBandit;
