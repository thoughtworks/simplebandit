import React from "react";
import { createRoot } from "react-dom/client";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";

import BasicFruitBandit from "./BasicBandit.jsx";
import TemperatureFruitBandit from "./TemperatureBandit.jsx";
import SlateFruitBandit from "./SlateBandit.jsx";
import WeightedFruitBandit from "./WeightedBandit.jsx";
import ContextFruitBandit from "./ContextBandit.jsx";

const root = document.getElementById("root");

function App() {
  return (
    <Tabs>
      <TabList>
        <Tab>Basic Example</Tab>
        <Tab>Adjusting learning rate and temperature</Tab>
        <Tab>Slates</Tab>
        <Tab>Multiple weighted oracles</Tab>
        <Tab>Context dependent</Tab>
      </TabList>

      <TabPanel>
        <BasicFruitBandit />
      </TabPanel>
      <TabPanel>
        <TemperatureFruitBandit />
      </TabPanel>
      <TabPanel>
        <SlateFruitBandit />
      </TabPanel>
      <TabPanel>
        <WeightedFruitBandit />
      </TabPanel>
      <TabPanel>
        <ContextFruitBandit />
      </TabPanel>
    </Tabs>
  );
}

createRoot(root).render(<App />);
