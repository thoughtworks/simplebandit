import React from "react";
import { render  } from "@testing-library/react";
import WeightedFruitBandit from "../WeightedBandit";

describe("WeightedFruitBandit", () => {
  it("renders without crashing", () => {
    render(<WeightedFruitBandit />);
  });
});
