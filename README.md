# SimpleBandit

SimpleBandit is a lightweight typescript/javascript library for contextual bandits, with no external dependencies, transpiling to <1000 lines of javascript.

It provides classes and interfaces to create and manage bandit models, generate recommendations, select actions, and update your models. Easily integrates with React Native to support privacy sensitive recommendations on the user's device. 

Under the hood it's a logistic regression oracle with softmax exploration.

## Installation

```sh
npm install .
```

## Usage

### With actionIds only

In the simplest case you are simply learning a preference over a list of possible actions, without regards to context or action features. By accepting a recommendation you make the recommended action more likely in the future. By rejecting it, you make it less likely. The bandit learns from your feedback, and adjusts.

```typescript
import { SimpleBandit } from "simplebandit";

const bandit = SimpleBandit.fromActionIds({ actionIds: ["apple", "pear"] });

let recommendation = bandit.recommend();
bandit.accept(recommendation);
consolo.log(recommendation.actionId)

recommendation2 = bandit.recommend();
bandit.reject(recommendation2);
```

### With action features

By defining action features we can also learn across actions: e.g. by choosing a fruit we make other fruits also more likely for the next recommendation.

```typescript
const actions: IAction[] = [
  { actionId: "apple", features: { fruit: 1 } },
  { actionId: "pear", features: { fruit: 1 } },
  { actionId: "chocolate", features: { fruit: 0 } },
];

const bandit = SimpleBandit.fromActions({ actions: actions });
```

### Adding context

We can also learn preferences depending on a context, for example whether it is raining or not.

```typescript
const bandit = new SimpleBandit.fromContextAndActionIds({
  context: ["rain"],
  actionIds: ["apple", "pear"],
});
let recommendation = bandit.recommend({ rain: 1 });
```

### Configuring learning rate and temperature

You can adjust how quick the bandit learns (and forgets) with the `learningRate`. You can adjust how much it exploits (low `temperature` means higher probability for higher scoring actions) or explores (higher `temperature` means higher probability for lower scoring actions):

```typescript
const bandit = SimpleBandit.fromActionIds({
  actionIds: ["apple", "pear"],
  learningRate: 1.0,
  temperature: 0.2,
});
```

### Getting multiple recommendations

In order to get multiple recommendation (or a 'slate'):

```typescript
const bandit = SimpleBandit.fromActionIds({
  actionIds: ["apple", "pear", "banana"],
  slateSize: 2,
});
let slate = bandit.slate();
console.log(slate.slateActions[0].actionId)
bandit.choose(slate, "apple");
//bandit.reject(slate)
```

### Serializing and storing bandits

You can easily serialize/deserialize bandits to/from JSON. So you can store e.g. a personalized bandit for each user and load them on demand.

```typescript
const bandit2 = SimpleBandit.fromJSON(bandit1.toJSON());
```

### Retaining training data

The `accept`, `reject` and `choose` methods also return a `trainingData` object.
These can be stored so that you can re-train the bandit at a later point (perhaps with e.g. a different learningRate, or with different initial weights):

```typescript
const trainingData = bandit.accept(recommendation);
const bandit2 = bandit.fromActionIds({ actionIds: ["apple", "pear"] });
bandit2.train([trainingData]);
```

## Defining your own oracle

For more control you can define your own oracle before passing it on to the bandit:

```typescript
oracle = new SimpleOracle({
  actionIds = ['apple', 'pear'],
  context = ['rainy'],
  actionFeatures = ['fruit'],
  learningRate = 1.0, 
  contextActionIdInteractions = true, // can switch off context-actionId interactions
  contextActionFeatureInteractions = true, // can switch off context-actionFeatures interactions
  useInversePropensityWeighting = true, // oracle uses ipw by default (sample weight = 1/p), but can be switched off
  negativeClassWeight = 1.0, // higher or lower sample weight for negative class
  targetLabel = "click", // target label for oracle, can differ for WeightedBandits
  strictFeatures = true, // if false fill missing features with 0, instead of raising error
  weights = {}, // initialize oracle with weights
});

bandit = new SimpleBandit({
  oracles:oracle,
  temperature:0.2,
});
```

## Multiple oracles

The default oracle only optimizes for accepts/clicks, but in many cases you want to optimize for other objectives or maybe a mixture of different objectives. For that you can use `WeightedBandit` or `WeightedMultiBandit`:

```typescript
const oracles = [
  new SimpleOracle(
      {
          context:['sunny', 'rainy'],
          actionIds: ['apple', 'pear'],
          features: ['fruit'],
          learningRate: learningRate,
          tartgetLabel: 'click', // default
      }),
  oracle: new SimpleOracle(
      {
          context:['sunny', 'rainy'],
          actionIds: ['apple', 'pear'],
          features: ['fruit'],
          learningRate: learningRate,
          targetLabel: 'stars',
      }),
];

const bandit = new SimpleBandit({
  oracles:oracles,
  actions:actions,
  temperature:temperature,
});
```

The `accept`, `reject` and `choose` methods still work the same for for all oracles with `targerLabel: 'click'`. For other `targetLabels` there is the `feedback` method:

```typescript
recommendation = bandit.recommend(context)
bandit.feedback(
  recommendation,
  'stars', // targetLabel
  1.0, // value: should be -1 < value < 1 
  //'apple' for WeightedMultiBandit also specifiy the actionId
)
```

## Usage javascript

There are several pure javascript examples provided in the `examples/` directory:

- `simplest.html`: only actionIds, no debug info
- `simple.html`: adds a lot more debug info to see what's going on under the hood
- `actionfeatures.html`: adds action features.
- `contextfeatures.html`: adds context features
- `slate.html`: multiple recommendations (slate)
- `weighted.html`: multiple (weighted) oracles instead of just one

## Testing

```sh
npm run test
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
