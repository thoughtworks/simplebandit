![GitHub Workflow Status (with event)](https://img.shields.io/github/actions/workflow/status/thoughtworks/simplebandit/node.js.yml)
![NPM](https://img.shields.io/npm/l/simplebandit)
![npm](https://img.shields.io/npm/v/simplebandit)

<img src="https://github.com/thoughtworks/simplebandit/assets/27999937/fb71b387-689d-4fd6-a80f-8eea37278d2c" width="50" align="right" alt="simplebandit-logo-transparent"/>

# simplebandit

Simplebandit is a lightweight typescript/javascript library for contextual bandit recommenders, with no external dependencies, transpiling to <700 lines of javascript.

It provides classes and interfaces to create and manage bandit models, generate recommendations, select actions, and update your models. Easily integrates with e.g. React Native to support privacy sensitive and fully interpretable recommendations right on a user's device.

You can find the live examples deployed at [https://thoughtworks.github.io/simplebandit/](https://thoughtworks.github.io/simplebandit/).

Under the hood it's a online logistic regression oracle with softmax exploration.

## Installation

The project is still in alpha, but can be installed with

```sh
npm install simplebandit
```

All feedback is welcome.

## Usage

### With actionIds only

In the simplest case you are simply learning a preference over a list of possible actions, without regards to context or action features. By accepting a recommendation you make the recommended action more likely in future recommendations. By rejecting it, you make it less likely. The bandit learns from your feedback, updates, and adjusts.

```typescript
import { SimpleBandit } from "simplebandit";

const bandit = new SimpleBandit({ actions: ["apple", "pear"] });

const recommendation1 = bandit.recommend();
await bandit.accept(recommendation1);
console.log(recommendation1.actionId);

const recommendation2 = bandit.recommend();
await bandit.reject(recommendation2);
```

### With action features

By defining action features we can also learn across actions: e.g. by choosing a fruit we make other fruits also more likely for the next recommendation.

```typescript
const actions: IAction[] = [
  { actionId: "apple", features: { fruit: 1 } },
  { actionId: "pear", features: { fruit: 1 } },
  { actionId: "chocolate", features: { fruit: 0 } },
];

const bandit = new SimpleBandit({ actions: actions });
```

If you accept an `apple` recommendations, the probability of both `apple` and `pear` will go up for the next recommendation. (N.B. all features values should be encoded between -1 and 1.)

There are a few short hand ways of defining actions. For actions without features you can simply pass a list of `actionsIds` as above: `actions = ["apple", "pear"]`. For actions with features you can use the list of `IActions` or use a hash as a short-hand:

```typescript
actions = {
  apple: { fruit: 1 },
  chocolate: { fruit: 0, treat: 1 },
};
```

If all your features have the value `1`, you can also pass them as a list, so:

```typescript
actions = {
  apple: ["fruit", "healthy"],
  chocolate: ["treat", "tasty"],
};
```

is equivalent to

```typescript
actions = {
  apple: { fruit: 1, healthy: 1 },
  chocolate: { treat: 1, tasty: 1 },
};
```

(but slightly more readable when you have lots of features)

### Adding context

We can also learn preferences depending on a context, by passing the relevant context as a hash into the `recommend` method. After positive feedback the bandit will learn to give similar recommendations given a similar context. For example when it is raining, recommend chocolate, when it is not, recommend apples. Like feature values, also context values should be encoded between `-1` and `1`.

```typescript
const recommendation = bandit.recommend({ rain: 1 });
await bandit.accept(recommendation);
```

### Configuring the exploration-exploitation tradeoff with the temperature parameter

You can adjust how much the bandit exploits (assigning higher probability to higher scoring actions) or explores (assigning less low probability to lower scoring actions). In the most extreme case `temperature=0.0` you only ever pick the highest scoring action, never randomly exploring.

```typescript
const bandit = new SimpleBandit({
  actions: ["apple", "pear"],
  temperature: 0.2,
});
```

It is worthwhile playing around with this parameter for your use case. Too much exploitation (low temperature) might mean you get stuck in a suboptimal optimization, and you do not adjust to changing preferences or circumstances. Too much exploration (high temperature), might mean you are not giving the best recommendations often enough.

### Slates: Getting multiple recommendations

In order to get multiple recommendation (or a 'slate') instead of just one, call `bandit.slate()`:

```typescript
const bandit = new SimpleBandit({
  actions: ["apple", "pear", "banana"],
  slateSize: 2,
});
let slate = bandit.slate();
await bandit.choose(slate, slate.slateItems[1].actionId);
//bandit.reject(slate)
```

You can pass slateSize as a parameter to the bandit, or to the slate method itself:

```typescript
slate = bandit.slate({ rain: 1 }, { slateSize: 3 });
```

When you call `bandit.choose(...)` you generate both an accept training data point for the chosen `actionId`, and rejection training data points for the not-chosen `slateItems`. You can set a lower sample weight on the rejected options with e.g. `slateNegativeSampleWeight=0.5`.`

### Serializing and storing bandits

You can easily serialize/deserialize bandits to/from JSON. So you can store e.g. a personalized bandit for each user and load them on demand.

```typescript
const bandit2 = SimpleBandit.fromJSON(bandit1.toJSON());
```

### Retaining training data

The `accept`, `reject` and `choose` methods also return a `trainingData[]` object.
These can be stored so that you can re-train the bandit at a later point (perhaps with e.g. a different oracle learningRate, or with different initial weights):

```typescript
const trainingData = await bandit.accept(recommendation);
const bandit2 = new SimpleBandit({ actions: ["apple", "pear"] });
await bandit2.train(trainingData);
```

## Defining custom oracle

For more control over the behaviour of your bandit, you can customize the oracle:

```typescript
oracle = new SimpleOracle({
  actionIds: ["apple", "pear"], // only encode certain actionIds, ignore others
  context: ["rainy"], // only encode certain context features, ignore others
  features: ["fruit"], // only encode certain action features, ignore others
  learningRate: 0.1, // how quick the oracle learns (and forgets)
  regularizer: 0.0, // L2 (ridge) regularization parameter on the weights
  actionIdFeatures: true, // learn preference for individual actions, regardless of context
  actionFeatures: true, // learn preference over action features, regardless of context
  contextActionIdInteractions: true, // learn interaction between context and actionId preference
  contextActionFeatureInteractions: true, // learn interaction between context and action features preference
  useInversePropensityWeighting: true, // oracle uses ipw by default (sample weight = 1/p), but can be switched off
  laplaceSmoothing: 0.01, // add constant to probability before applying ipw
  targetLabel: "click", // target label for oracle, defaults to 'click', but can also be e.g. 'rating'
  oracleWeight: 1.0, // if using multiple oracles, how this one is weighted
  name: "click1", // name is by default equal to targetLabel, but can give unique name if needed
  weights: {}, // initialize oracle with feature weights hash
});

bandit = new SimpleBandit({
  oracle: oracle,
  temperature: 0.2,
});
```

## Multiple oracles

The default oracle only optimizes for accepts/clicks, but in many cases you may want to optimize for other objectives or maybe a mixture of different objectives. You can pass a list of oracles that each learn to predict a different `targetLabel`:

```typescript
const clickOracle = new SimpleOracle({
    targetLabel: "click", // default
  })
const starOracle = new SimpleOracle({
    targetLabel: "stars", // if users leave a star rating after an action
    oracleWeight: 2.0, // this oracle is weighted twice as heavily as the clickOracle
    learningRate: 0.5, // can customize settings for each oracle
  }),
];

const bandit = new SimpleBandit({
  oracle: [clickOracle, starOracle],
  actions: actions,
  temperature: temperature,
});
```

The `accept`, `reject` and `choose` methods still work the same for for all oracles with `targetLabel: 'click'`.

For other `targetLabels` there is the `feedback` method. You need to specify the `label` and the `value` (which should be between `0` and `1`):

```typescript
recommendation = bandit.recommend();
await bandit.feedback(
  recommendation,
  "stars", // targetLabel
  1.0, // value: should be 0 < value < 1
);
```

For a slate you also have to specify which action was chosen:

```typescript
slate = bandit.slate();
await bandit.feedback(
  slate,
  "stars",
  1.0,
  slate.slateItems[0].actionId, // if first item was chosen
);
```

## Excluding actions

In some contexts you might want to apply business rules and exclude certain `actionIds`, or only include certain others:

```typescript
recommendation = bandit.recommend(context, { exclude: ["apple"] });
slate = bandit.slate(context, { include: ["banana", "pear"] });
```

## Examples

There are several usage examples provided in the `examples/` folder (built with react).
You can run the examples with `parcel examples/index.html` or `make example` and then view them on e.g. `http://localhost:1234`.

Or simply visit [https://thoughtworks.github.io/simplebandit/](https://thoughtworks.github.io/simplebandit/).

## Testing

```sh
npm run test
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
