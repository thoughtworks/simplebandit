import React from "react";
import { render } from "@testing-library/react";
import ContextFruitBandit from "../ContextBandit";

describe("ContextFruitBandit", () => {
  it("renders without crashing", () => {
    render(<ContextFruitBandit />);
  });
});
