import {
  weightedHarmonicMean,
  ConvertScoresToProbabilityDistribution,
  SampleFromProbabilityDistribution,
  CosineSimilarity,
} from "../MathService";

describe("weightedHarmonicMean", () => {
  it("should calculate the weighted harmonic mean correctly", () => {
    const numbers = [2, 3, 4];
    const weights = [1, 2, 3];
    const expectedWeightedHarmonicMean = 3.13;
    expect(weightedHarmonicMean(numbers, weights)).toBeCloseTo(
      expectedWeightedHarmonicMean,
      3,
    );
  });

  it("should throw an error when the length of numbers and weights arrays is not the same", () => {
    const numbers = [2, 3, 4];
    const weights = [1, 2];
    expect(() => weightedHarmonicMean(numbers, weights)).toThrowError(
      "The length of numbers array and weights array must be the same.",
    );
  });

  it("should throw an error when a value in the numbers array is zero", () => {
    const numbers = [2, 0, 4];
    const weights = [1, 2, 3];
    expect(() => weightedHarmonicMean(numbers, weights)).toThrowError(
      "Cannot calculate harmonic mean when a value in the numbers array is zero.",
    );
  });
});

describe("ConvertScoresToProbabilityDistribution", () => {
  it("should correctly calculate probabilities with positive scores", () => {
    const scores = [0.2, 0.6, 0.8];
    const temperature = 1;
    const expectedProbabilities = [0.2318, 0.3458, 0.4223];
    const result = ConvertScoresToProbabilityDistribution(scores, temperature);
    for (let i = 0; i < result.length; i++) {
      expect(result[i]).toBeCloseTo(expectedProbabilities[i], 3);
    }
  });

  it("should correctly calculate probabilities with negative scores", () => {
    const scores = [-1, -3, -5];
    const temperature = 1;
    const expectedProbabilities = [0.8668, 0.1173, 0.0158];
    const result = ConvertScoresToProbabilityDistribution(scores, temperature);
    for (let i = 0; i < result.length; i++) {
      expect(result[i]).toBeCloseTo(expectedProbabilities[i], 3);
    }
  });

  it("should correctly calculate probabilities with mixed scores", () => {
    const scores = [1, -2, 3];
    const temperature = 2;
    const expectedProbabilities = [0.0179, 0.0, 0.9819];
    const result = ConvertScoresToProbabilityDistribution(scores, temperature);
    for (let i = 0; i < result.length; i++) {
      expect(result[i]).toBeCloseTo(expectedProbabilities[i], 3);
    }
  });

  it("should throw an error when temperature is 0", () => {
    const scores = [1, 2, 3];
    const temperature = 0;
    expect(() => {
      ConvertScoresToProbabilityDistribution(scores, temperature);
    }).toThrowError("temperature must be greater than zero");
  });

  it("should throw an error when scores array is empty", () => {
    const scores: number[] = [];
    const temperature = 1;
    expect(() => {
      ConvertScoresToProbabilityDistribution(scores, temperature);
    }).toThrowError("scores array must not be empty");
  });

  it("should throw an error when there only negative infinities in the scores array", () => {
    const scores = [-Infinity, -Infinity, -Infinity];
    const temperature = 1;
    expect(() => {
      ConvertScoresToProbabilityDistribution(scores, temperature);
    }).toThrowError("scores array must contain at least one finite number");
  });

  it("should throw an error when there are infinite scores", () => {
    const scores = [1, 2, Infinity];
    const temperature = 1;
    expect(() => {
      ConvertScoresToProbabilityDistribution(scores, temperature);
    }).toThrowError(`score at index 2 must be a finite number`);
  });
});

describe("SampleFromProbabilityDistribution", () => {
  describe("when given invalid input", () => {
    it("should throw an error when the probabilities array is empty", () => {
      expect(() => SampleFromProbabilityDistribution([])).toThrow(
        "probs array must not be empty",
      );
    });

    it("should throw an error when the probabilities array contains negative numbers", () => {
      expect(() => SampleFromProbabilityDistribution([-1, 0, 1])).toThrow(
        "probs array must contain only non-negative numbers",
      );
    });

    it("should throw an error when the probabilities array contains numbers greater than 1", () => {
      expect(() => SampleFromProbabilityDistribution([0.5, 1.5, 0.25])).toThrow(
        "probs array must contain numbers between 0 and 1",
      );
    });

    it("should throw an error when the sum of probabilities is not greater than 0", () => {
      expect(() => SampleFromProbabilityDistribution([0, 0, 0])).toThrow(
        "probs must sum to a value greater than zero",
      );
    });
  });

  describe("when given valid input", () => {
    it("should return the correct index when the probabilities are [0.1, 0.2, 0.3, 0.4] and Math.random() returns 0.4", () => {
      // Arrange
      jest.spyOn(Math, "random").mockReturnValue(0.4);

      // Act
      const result = SampleFromProbabilityDistribution([0.1, 0.2, 0.3, 0.4]);

      // Assert
      expect(result).toBe(2);

      // Clean up
      jest.spyOn(Math, "random").mockRestore();
    });

    it("should return the correct index when the probabilities are [0.2, 0.3, 0.5] and Math.random() returns 0.6", () => {
      // Arrange
      jest.spyOn(Math, "random").mockReturnValue(0.6);

      // Act
      const result = SampleFromProbabilityDistribution([0.2, 0.3, 0.5]);

      // Assert
      expect(result).toBe(2);

      // Clean up
      jest.spyOn(Math, "random").mockRestore();
    });

    it("should return the correct index when the probabilities are [0.4, 0.4, 0.2] and Math.random() returns 0.3", () => {
      // Arrange
      jest.spyOn(Math, "random").mockReturnValue(0.3);

      // Act
      const result = SampleFromProbabilityDistribution([0.4, 0.4, 0.2]);

      // Assert
      expect(result).toBe(0);

      // Clean up
      jest.spyOn(Math, "random").mockRestore();
    });
  });
});

describe("CosineSimilarity", () => {
  it("should return 1 for two identical vectors", () => {
    const A = [1, 2, 3];
    expect(CosineSimilarity(A, A)).toBe(1);
  });

  it("should return -1 for two vectors pointing in opposite directions", () => {
    const A = [1, 2, 3];
    const B = [-1, -2, -3];
    expect(CosineSimilarity(A, B)).toBe(-1);
  });

  it("should return 0 for two orthogonal vectors", () => {
    const A = [1, 0, 0];
    const B = [0, 1, 0];
    expect(CosineSimilarity(A, B)).toBeCloseTo(0, 6);
  });

  it("should return a value between -1 and 1 for two random vectors", () => {
    const A = [1, 2, 3, 4];
    const B = [5, 6, 7, 8];
    const similarity = CosineSimilarity(A, B);
    expect(similarity).toBeGreaterThanOrEqual(-1);
    expect(similarity).toBeLessThanOrEqual(1);
  });

  it("should throw an error if A and B have different lengths", () => {
    const A = [1, 2, 3];
    const B = [4, 5];
    expect(() => CosineSimilarity(A, B)).toThrow(
      "Arrays must have the same length",
    );
  });

  it("should throw an error if A or B contains non-finite numbers", () => {
    const A = [1, 2, 3];
    const B = [4, 5, Infinity];
    expect(() => CosineSimilarity(A, B)).toThrow(
      "Invalid input. Both A and B should be arrays of finite numbers.",
    );
  });

  it("should return 0 if A and B are empty arrays", () => {
    const A: number[] = [];
    const B: number[] = [];
    expect(CosineSimilarity(A, B)).toBeCloseTo(0, 6);
  });
});
