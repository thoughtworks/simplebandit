# SimpleBandit

SimpleBandit is a lightweight typescript/javascript library for contextual bandit recommenders, with no external dependencies, transpiling to <600 lines of javascript.

It provides classes and interfaces to create and manage bandit models, generate recommendations, select actions, and update your models. Easily integrates with e.g. React Native to support privacy sensitive and fully interpretable recommendations right on a user's device.

Under the hood it's a logistic regression oracle with softmax exploration.

## Installation

The project is not (yet) uploaded to npm, but can be installed locally with

```sh
npm install
```

## Usage

### With actionIds only

In the simplest case you are simply learning a preference over a list of possible actions, without regards to context or action features. By accepting a recommendation you make the recommended action more likely in the future. By rejecting it, you make it less likely. The bandit learns from your feedback, and adjusts.

```typescript
import { SimpleBandit } from "simplebandit";

const bandit = new SimpleBandit({ actions: ["apple", "pear"] });

let recommendation1 = bandit.recommend();
await bandit.accept(recommendation1);
consolo.log(recommendation1.actionId);

recommendation2 = bandit.recommend();
await bandit.reject(recommendation2);
```

### With action features

By defining action features we can also learn across actions: e.g. by choosing a fruit we make other fruits also more likely for the next recommendation. N.B. all features values should be encoded between -1 and 1.

```typescript
const actions: IAction[] = [
  { actionId: "apple", features: { fruit: 1 } },
  { actionId: "pear", features: { fruit: 1 } },
  { actionId: "chocolate", features: { fruit: 0 } },
];

const bandit = new SimpleBandit({ actions: actions });
```

There are a few short hand ways of defining actions. For actions without features you can simply pass a list of `actionsIds` as above: `actions = ["apple", "pear"]`. For actions with features you can use a list of `IActions` or use a hash as a short-hand:

```typescript
actions = {
  apple: { fruit: 1 },
  chocolate: { fruit: 0, treat: 1 },
};
```

If all your features have the value `1`, you can also pass them as a list:

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

### Adding context

We can also learn preferences depending on a context, by passing the relevant context into the `recommend` method. After feedback the bandit will learn to give better recommendations given a certain context, for example whether it is raining or not. Like feature values, context values should also be encoded between `-1` and `1`.

```typescript
const recommendation = bandit.recommend({ rain: 1 });
await bandit.accept(recommendation);
```

### Configuring exploration and exploitation tradeoff with the temperature parameter

You can adjust how much the bandit exploits (assigning higher probability to higher scoring actions) or explores (assigning less low probability to lower scoring actions):

```typescript
const bandit = new SimpleBandit({
  actions: ["apple", "pear"],
  temperature: 0.2,
});
```

It is worthwhile playing around with this parameter for your use case. Too much exploitation (low temperature) might mean you get stuck in a suboptimal optimization. Too much exploration (high temperature), might mean you are not giving the best recommendations often enough.

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

### Serializing and storing bandits

You can easily serialize/deserialize bandits to/from JSON. So you can store e.g. a personalized bandit for each user and load them on demand.

```typescript
const bandit2 = SimpleBandit.fromJSON(bandit1.toJSON());
```

### Retaining training data

The `accept`, `reject` and `choose` methods also return a `trainingData[]` object.
These can be stored so that you can re-train the bandit at a later point (perhaps with e.g. a different learningRate, or with different initial weights):

```typescript
const trainingData = await bandit.accept(recommendation);
const bandit2 = new SimpleBandit({ actions: ["apple", "pear"] });
bandit2.train(trainingData);
```

## Defining custom oracle

For more control over the behaviour of your bandit, you customize the oracle:

```typescript
oracle = new SimpleOracle({
  actionIds: ["apple", "pear"], // only encode certain actionIds, ignore others
  context: ["rainy"], // only encode certain context features, ignore others
  features: ["fruit"], // only encode certain action features, ignore others
  learningRate: 0.1, // how quick the oracle learns (and forgets)
  actionIdFeatures: true, // learn preference for individual actions, regardless of context
  actionFeatures: true, // learn preference over action features, regardless of context
  contextActionIdInteractions = true, // learn interaction between context and actionId preference
  contextActionFeatureInteractions = true, // learn interaction between context and action features preference
  useInversePropensityWeighting = true, // oracle uses ipw by default (sample weight = 1/p), but can be switched off
  targetLabel = "click", // target label for oracle, defaults to 'click', but can also be e.g. 'rating'
  oracleWeight = 1.0, // if using multiple oracles, how this one is weighted
  name = "click1", // name is by default equal to targetLabel, but can give unique name if needed
  weights = {}, // initialize oracle with feature weights hash
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
recommendation = bandit.recommend(context);
bandit.feedback(
  recommendation,
  "stars", // targetLabel
  1.0, // value: should be 0 < value < 1
);
```

For a slate you also have to specify which action was chosen:

```typescript
slate = bandit.recommend(context);
bandit.feedback(
  slate,
  "stars",
  1.0,
  slate.slateItems[0].actionId, // if first item was chosen
);
```

## Excluding actions

In some contexts you might want to apply business rules and exclude certain `actionIds``, or only include certain others:

```typescript
recommendation = bandit.recommend(context, { exclude: ["apple"] });
slate = bandit.slate(context, { include: ["banana", "pear"] });
```

## Examples

There are several usage examples provided in the `examples/` directory in both pure html/javascript and react.

The `html` examples can be simply opened in the browser (after having run `make build` first of course)

The `react` examples can be built with e.g. parcel:

```sh
cd examples/react
parcel index.html
```

## Testing

```sh
npm run test
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
