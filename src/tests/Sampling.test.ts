import {
  ConvertScoresToProbabilityDistribution,
  SampleFromProbabilityDistribution,
} from "../Sampling";


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