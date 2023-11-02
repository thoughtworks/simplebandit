

export function weightedHarmonicMean(numbers: number[], weights: number[]): number {
    if (numbers.length !== weights.length) {
      throw new Error("The length of numbers array and weights array must be the same.");
    }
    let sumWeightedValues = 0;
    let sumWeights = 0;
    for (let i = 0; i < numbers.length; i++) {
      if (numbers[i] === 0) {
        throw new Error("Cannot calculate harmonic mean when a value in the numbers array is zero.");
      }
      sumWeightedValues += weights[i] / numbers[i];
      sumWeights += weights[i];
    }
    return sumWeights / sumWeightedValues;
  }

export const ConvertScoresToProbabilityDistribution = (scores: number[], softmaxBeta: number): number[] => {
    if (scores.length === 0) {
      throw new Error('scores array must not be empty');
    }
    if (softmaxBeta <= 0) {
      throw new Error('softmaxBeta must be greater than zero');
    }
  
    const maxScore = Math.max(...scores);
    if (maxScore === -Infinity) {
      throw new Error('scores array must contain at least one finite number');
    }
  
    let probabilities: number[] = [];
    let softmaxDenominator = 0;
    const softmaxNumerators: number[] = [];
    for (let i = 0; i < scores.length; i++) {
      const score = scores[i];
      if (!Number.isFinite(score)) {
        throw new Error(`score at index ${i} must be a finite number`);
      }
  
      const softmaxNumerator = Math.exp(softmaxBeta * (score - maxScore));
      softmaxDenominator += softmaxNumerator;
      softmaxNumerators.push(softmaxNumerator);
    }
  
    for (let i = 0; i < softmaxNumerators.length; i++) {
      probabilities.push(softmaxNumerators[i] / softmaxDenominator);
    }
    
    return probabilities;
  }


export const SampleFromProbabilityDistribution = (probs: number[]): number => {
    if (probs.length === 0) {
        throw new Error('probs array must not be empty');
    }
    if(!probs.every(prob => prob >= 0)) {
        throw new Error('probs array must contain only non-negative numbers');
    }
    if(!probs.every(prob => prob <= 1)) {
      throw new Error('probs array must contain numbers between 0 and 1');
    }
    
    const sum = probs.reduce((a, b) => a + b, 0); 
    if (sum <= 0) {
        throw Error('probs must sum to a value greater than zero')
    }
    const normalized = probs.map(prob => prob / sum) 
    
    const sample = Math.random() 
    let total = 0
    for (let i = 0; i < normalized.length; i++) {
        total += normalized[i] 
        if (sample < total) { return i }
    }
    return -1;
}

export const CosineSimilarity = (A: number[], B: number[]): number => {
    if (!Array.isArray(A) || !Array.isArray(B) || !A.every(Number.isFinite) || !B.every(Number.isFinite)) {
        throw new TypeError("Invalid input. Both A and B should be arrays of finite numbers.");
    }
    if (A.length !== B.length) {
      throw new Error("Arrays must have the same length");
    }
    if (A.length === 0) {
      return 0;
    }
    let dotProduct = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < A.length; i++) {
      dotProduct += A[i] * B[i];
      magA += A[i] * A[i];
      magB += B[i] * B[i];
    }
    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);
    const similarity = dotProduct / (magA * magB);
    return similarity;
  };
