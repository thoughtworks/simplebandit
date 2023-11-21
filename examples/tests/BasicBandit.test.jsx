import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import BasicFruitBandit from "../BasicBandit";
import { SimpleBandit } from "../../dist/index";

jest.mock("../../dist/index", () => {
  return {
    SimpleBandit: jest.fn().mockImplementation(function () {
      this.accept = jest.fn().mockResolvedValue([]);
      this.reject = jest.fn().mockResolvedValue([]);

      return {
        getScoredActions: () => [
          { actionId: "apple", score: 0.5, probability: 0.33 },
          { actionId: "pear", score: 0.5, probability: 0.33 },
          { actionId: "orange", score: 0.5, probability: 0.33 },
        ],
        recommend: () => ({
          context: {},
          actionId: "apple",
          score: 0.5,
          probability: 0.33,
        }),
        accept: this.accept,
        reject: this.reject,
      };
    }),
  };
});

describe("BasicFruitBandit", () => {
  beforeEach(() => {
    SimpleBandit.mockClear();
  });

  it("renders without crashing", () => {
    render(<BasicFruitBandit />);
  });

  it("renders fruit probabilities", async () => {
    const { findByText } = render(<BasicFruitBandit />);
    const appleProbability = screen.getByText(/apple\s*\(33/i);
    expect(appleProbability).not.toBeNull();
    const pearProbability = screen.getByText(/pear\s*\(33/i);
    expect(pearProbability).not.toBeNull();
    const orangeProbability = screen.getByText(/orange\s*\(33/i);
    expect(orangeProbability).not.toBeNull();
  });

  it("handles accept and reject", async () => {
    render(<BasicFruitBandit />);
    const acceptButton = screen.getByText("Accept");
    const rejectButton = screen.getByText("Reject");

    fireEvent.click(acceptButton);
    await waitFor(() =>
      expect(SimpleBandit.mock.instances[0].accept).toHaveBeenCalled(),
    );

    fireEvent.click(rejectButton);
    await waitFor(() =>
      expect(SimpleBandit.mock.instances[0].reject).toHaveBeenCalled(),
    );
  });
});
