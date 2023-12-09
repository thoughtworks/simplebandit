import React, { useState, useEffect } from "react";
import { SimpleBandit } from "../dist/cjs/index";

function BasicFruitBandit() {
  const [bandit, setBandit] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [scoredActions, setScoredActions] = useState([]);

  useEffect(() => {
    const banditInstance = new SimpleBandit({
      actions: ["apple", "pear", "orange"],
      temperature: 0.1,
    });
    setBandit(banditInstance);
  }, []);

  useEffect(() => {
    if (bandit) {
      generateNewRecommendation();
    }
  }, [bandit]);

  const generateNewRecommendation = () => {
    setScoredActions(bandit.getScoredActions());
    setRecommendation(bandit.recommend());
  };

  const handleAccept = async () => {
    await bandit.accept(recommendation);
    generateNewRecommendation();
  };

  const handleReject = async () => {
    await bandit.reject(recommendation);
    generateNewRecommendation();
  };

  return (
    <div>
      <h3>Simple Fruit Bandit</h3>
      <p>
        This is the simplest example of a bandit that is learning the preference
        among three types of fruit: apple, pear or orange.
      </p>
      <p>
        When you eat a fruit, the probability of that fruit goes up. When you
        reject a fruit, the probability goes down
      </p>
      <h3>Fruit probabilities</h3>
      <div>
        {scoredActions.map((scoredAction) => (
          <p key={scoredAction.actionId}>
            {scoredAction.actionId} (
            {(scoredAction.probability * 100).toFixed(1)}%)
          </p>
        ))}
      </div>
      <h3>Fruit recommendation</h3>
      <div>
        <p>
          Keep eating apples, and rejecting the other options, and see how
          quickly the bandit learns your preference.{" "}
        </p>
        <p>
          Then switch to preferring oranges, and see how quick the bandit
          adapts.
        </p>
      </div>
      {recommendation && (
        <div>
          <b>{recommendation.actionId}</b>
        </div>
      )}
      <button onClick={handleAccept}>Eat</button>
      <button onClick={handleReject}>Don't eat</button>
    </div>
  );
}

export default BasicFruitBandit;
