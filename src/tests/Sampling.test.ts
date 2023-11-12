import { SampleFromProbabilityDistribution } from "../Sampling";

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
      jest.spyOn(Math, "random").mockReturnValue(0.4);
      const result = SampleFromProbabilityDistribution([0.1, 0.2, 0.3, 0.4]);
      expect(result).toBe(2);
      jest.spyOn(Math, "random").mockRestore();
    });

    it("should return the correct index when the probabilities are [0.2, 0.3, 0.5] and Math.random() returns 0.6", () => {
      jest.spyOn(Math, "random").mockReturnValue(0.6);
      const result = SampleFromProbabilityDistribution([0.2, 0.3, 0.5]);
      expect(result).toBe(2);
      jest.spyOn(Math, "random").mockRestore();
    });

    it("should return the correct index when the probabilities are [0.4, 0.4, 0.2] and Math.random() returns 0.3", () => {
      jest.spyOn(Math, "random").mockReturnValue(0.3);
      const result = SampleFromProbabilityDistribution([0.4, 0.4, 0.2]);
      expect(result).toBe(0);
      jest.spyOn(Math, "random").mockRestore();
    });
  });
});
