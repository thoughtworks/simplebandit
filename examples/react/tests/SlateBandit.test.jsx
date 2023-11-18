import React from "react";
import { render  } from "@testing-library/react";
import SlateFruitBandit from "../SlateBandit";

describe("SlateFruitBandit", () => {
  it("renders without crashing", () => {
    render(<SlateFruitBandit />);
  });
});
