const { SimpleOracle, SimpleBandit, MultiBandit } = require("./src");

(window as any).SimpleOracle = SimpleOracle;
(window as any).SimpleBandit = SimpleBandit;
(window as any).MultiBandit = MultiBandit;

module.exports = { SimpleOracle, SimpleBandit, MultiBandit };
