const {
  SimpleOracle,
  SimpleBandit,
} = require("./src");

(window as any).SimpleOracle = SimpleOracle;
(window as any).SimpleBandit = SimpleBandit;

module.exports = {
  SimpleOracle,
  SimpleBandit,
};
