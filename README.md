# SimpleBandit
SimpleBandit is a TypeScript library for contextual bandits. It provides classes and interfaces to create and manage bandit models, make recommendations, and train your models.

## Installation

```sh
npm install .
```

## Usage Typescript

```typescript
import { SimpleBandit, SimpleOracle, IAction } from 'simplebandit';

// Define your actions
const actions: IAction[] = [
  { actionId: 'apple', features: { fruit: 1 } },
  { actionId: 'pear', features: { fruit: 1 } },
  { actionId: 'chocolate', features: { fruit: 0 } },
];

// Create an oracle
const oracle = new SimpleOracle({
  actionIds: ['apple', 'pear', 'chocolate'],
  context: ['morning'],
  actionFeatures: ['fruit'],
  learningRate: 1.0,
});

// Create a bandit
const bandit = new SimpleBandit(oracle, actions, 5.0);

// Make a recommendation
const context = { morning: 1 };
const recommendation = bandit.makeRecommendation(context);
console.log(recomendation.actionId)
// Accepting a recommendation makes the actionId more likely in the future
bandit.acceptRecommendation(recommendation)

const context2 = { morning: 0 };
const recommendation2 = bandit.makeRecommendation(context);
bandit.rejectRecommendation(recommendation)

```

## Usage javascript

There are several pure javascript examples provided in the `examples/` directory:

- `simplest.html`: only actions no debug info
- `simple.html`: adds a lot more debug info to see what's going on
- `actionfeatures.html`: An example of a bandit that uses action features to make recommendations.
- `contextfeatures.html`: An example of a bandit that uses context features to make recommendations.
- `multi.html`: An example of a MultiBandit that generates a slate of multiple recommendations.



## Testing

```sh
npm run test
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.