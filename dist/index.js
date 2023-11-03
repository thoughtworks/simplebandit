"use strict";
const { SimpleOracle, SimpleBandit, MultiBandit } = require("./src");
window.SimpleOracle = SimpleOracle;
window.SimpleBandit = SimpleBandit;
window.MultiBandit = MultiBandit;
module.exports = { SimpleOracle, SimpleBandit, MultiBandit };
