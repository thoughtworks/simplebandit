export const ConvertScoresToProbabilityDistribution = (
  scores: number[],
  temperature: number,
): number[] => {
  if (scores.length === 0) {
    throw new Error("scores array must not be empty");
  }
  if (temperature <= 0) {
    throw new Error("temperature must be greater than zero");
  }

  const maxScore = Math.max(...scores);
  if (maxScore === -Infinity) {
    throw new Error("scores array must contain at least one finite number");
  }

  let probabilities: number[] = [];
  let softmaxDenominator = 0;
  const softmaxNumerators: number[] = [];
  for (let i = 0; i < scores.length; i++) {
    const score = scores[i];
    if (!Number.isFinite(score)) {
      throw new Error(`score at index ${i} must be a finite number`);
    }

    const softmaxNumerator = Math.exp(temperature * (score - maxScore));
    softmaxDenominator += softmaxNumerator;
    softmaxNumerators.push(softmaxNumerator);
  }

  for (let i = 0; i < softmaxNumerators.length; i++) {
    probabilities.push(softmaxNumerators[i] / softmaxDenominator);
  }

  return probabilities;
};

export const SampleFromProbabilityDistribution = (probs: number[]): number => {
  if (probs.length === 0) {
    throw new Error("probs array must not be empty");
  }
  if (!probs.every((prob) => prob >= 0)) {
    throw new Error("probs array must contain only non-negative numbers");
  }
  if (!probs.every((prob) => prob <= 1)) {
    throw new Error("probs array must contain numbers between 0 and 1");
  }

  const sum = probs.reduce((a, b) => a + b, 0);
  if (sum <= 0) {
    throw Error("probs must sum to a value greater than zero");
  }
  const normalized = probs.map((prob) => prob / sum);

  const sample = Math.random();
  let total = 0;
  for (let i = 0; i < normalized.length; i++) {
    total += normalized[i];
    if (sample < total) {
      return i;
    }
  }
  return -1;
};