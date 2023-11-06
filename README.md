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

In order to get multiple recommendation (or a 'slate') you use `MultiBandit`:

```typescript
import { MultiBandit } from "simplebandit";

const bandit = MultiBandit.fromActionIds({
  actionIds: ["apple", "pear", "banana"],
  nRecommendations: 2,
});
let recommendations = bandit.recommend();
console.log(recommendations.recommendedActions[0].actionId)
bandit.choose(recommendations, "apple");
//bandit.rejectAll(recommendations)
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

## Usage javascript

There are several pure javascript examples provided in the `examples/` directory:

- `simplest.html`: only actionIds, no debug info
- `simple.html`: adds a lot more debug info to see what's going on under the hood
- `actionfeatures.html`: adds action features.
- `contextfeatures.html`: adds context features
- `multi.html`: multiple recommendations (slate)
- `weighted.html`: multiple (weighted) oracles instead of just one

## Testing

```sh
npm run test
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
