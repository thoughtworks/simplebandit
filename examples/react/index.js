import React from 'react';
import { createRoot } from 'react-dom/client';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

import BasicFruitBandit from './basic.js';
import TemperatureFruitBandit from './temperature.js';
import SlateFruitBandit from './slate.js';
import WeightedFruitBandit from './weighted.js';

const root = document.getElementById('root');


function App() {
  return (
    <Tabs>
      <TabList>
        <Tab>Basic Example</Tab>
        <Tab>Adjusting learning rate and temperature</Tab>
        <Tab>Slates</Tab>
        <Tab>Multiple weighted oracles</Tab>
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
    </Tabs>
  );
}

createRoot(root).render(<App />);
