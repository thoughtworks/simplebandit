import React from "react";
import { render } from "@testing-library/react";
import TemperatureFruitBandit from "../TemperatureBandit";

describe("TemperatureFruitBandit", () => {
  it("renders without crashing", () => {
    render(<TemperatureFruitBandit />);
  });
});
