"use strict";
const { BanditOracle, SimpleBandit } = require('./src');
window.SimpleBandit = SimpleBandit;
window.BanditOracle = BanditOracle;
module.exports = { SimpleBandit, BanditOracle };
