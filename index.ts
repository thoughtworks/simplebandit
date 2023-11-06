const {
  SimpleOracle,
  SimpleBandit,
  MultiBandit,
  WeightedBandit,
  WeightedMultiBandit,
} = require("./src");

(window as any).SimpleOracle = SimpleOracle;
(window as any).SimpleBandit = SimpleBandit;
(window as any).MultiBandit = MultiBandit;
(window as any).WeightedBandit = WeightedBandit;
(window as any).WeightedMultiBandit = WeightedMultiBandit;

module.exports = {
  SimpleOracle,
  SimpleBandit,
  MultiBandit,
  WeightedBandit,
  WeightedMultiBandit,
};
