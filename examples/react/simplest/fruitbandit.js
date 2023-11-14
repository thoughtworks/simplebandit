import React, { useState, useEffect } from 'react';
import { SimpleBandit } from 'simplebandit'; // Assuming the library is exported as a module

function FruitBandit() {
  const [bandit, setBandit] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [scoredActions, setScoredActions] = useState([]);

  useEffect(() => {
    const banditInstance = new SimpleBandit({
      actions: ["apple", "pear", "orange"],
      temperature: 0.2,
    });
    setBandit(banditInstance);
  }, []);

  useEffect(() => {
    if (bandit) {
      generateNewRecommendation();
    }
  }, [bandit]);

  const generateNewRecommendation = () => {
    const recommendation = bandit.recommend();
    setRecommendation(recommendation);
    const scoredActions = bandit.getScoredActions();
    setScoredActions(scoredActions);
  };

  const handleEat = async () => {
    await bandit.accept(recommendation);
    generateNewRecommendation();
  };

  const handleDontEat = async () => {
    await bandit.reject(recommendation);
    generateNewRecommendation();
  };

  return (
    <div>
      <h1>Simplest Fruit Bandit</h1>
      <p>This is the simplest example of a bandit that is learning the preference among three types of fruit: apple, pear or orange.</p>
      <h2>Fruit probabilities:</h2>
      <div>
        {scoredActions.map((scoredAction) => (
          <p key={scoredAction.actionId}>
            {scoredAction.actionId} ({(scoredAction.probability * 100).toFixed(1)}%)
          </p>
        ))}
      </div>
      <h2>Recommended fruit:</h2>
      {recommendation && <div>{recommendation.actionId}</div>}
      <button onClick={handleEat}>Eat</button>
      <button onClick={handleDontEat}>Don't eat</button>
    </div>
  );
}

export default FruitBandit;