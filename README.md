# simpleBandit

An npm library for contextual bandits called simpleBandit.

## Installation

```bash
npm install simpleBandit
```

## Usage

```javascript
const SimpleBandit = require('simpleBandit');

// Create a new bandit instance
const bandit = new SimpleBandit(options);

// Update the bandit state
bandit.updateState(newState);

// Select an action based on the current state
const action = bandit.selectAction();

// Update the bandit based on the selected action and reward
bandit.updateBandit(action, reward);
```

## API

### SimpleBandit(options)

Constructor for SimpleBandit class.

- `options` (object): Options for the bandit.

### bandit.updateState(newState)

Method to update the bandit state.

- `newState` (object): New state to update.

### bandit.selectAction()

Method to select an action based on the current state.

Returns the selected action (string).

### bandit.updateBandit(action, reward)

Method to update the bandit based on the selected action and reward.

- `action` (string): Selected action.
- `reward` (number): Reward for the selected action.

## License

ISC

