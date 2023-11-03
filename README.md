# SimpleBandit

SimpleBandit is a convenient typescript/javascript library for contextual bandits, with no external dependencies, transpiling to <1000 lines of javascript.

It provides classes and interfaces to create and manage bandit models, generate recommendations, select actions, and update your models.

Under the hood it's a logistic regression oracle with softmax exploration.

## Installation

```sh
npm install .
```

## Usage

In the simplest case you are simply learning a preference over a list of possible actions, without context or action features. By accepting a recommendation you make the recommended action more likely in the future. By rejecting it, you make it less likely. The bandit learns from your feedback.

### With actionIds only

```typescript
import { SimpleBandit } from "simplebandit";

const bandit = SimpleBandit.fromActionIds({actionIds:["apple", "pear"]});

let recommendation = bandit.makeRecommendation();
bandit.acceptRecommendation(recomendation);

recommendation2 = bandit.makeRecommendation();
bandit.rejectRecommendation(recommendation2);
```

### With action features

By defining action features we can also learn across actions: by choosing a fruit we make other fruits also more likely for the next recomendation.

```typescript
// Define your actions
const actions: IAction[] = [
  { actionId: "apple", features: { fruit: 1 } },
  { actionId: "pear", features: { fruit: 1 } },
  { actionId: "chocolate", features: { fruit: 0 } },
];

const bandit = SimpleBandit.fromActions({actions:actions});
```

### Adding context

We can also learn preferences depending on a context, for example whether it is raining or not.

```typescript
const bandit = new SimpleBandit.fromContextAndActionIds(
  {
    context:["rain"],
    actionIds: ["apple", "pear"],
  }
);
let recommendation = bandit.makeRecommendation({ rain: 1 });
```

### Configuring learning rate and temperature

You can adjust how quick the bandit learns (and forgets) with the `learningRate`. You can adjust how much it exploits (higher probability for higher scoring actions) or explores (higher probability for lower scoring actions) with `temperature`:

```typescript
const bandit = SimpleBandit.fromActionIds({actionIds: ['apple', 'pear'], learningRate:1.0, temperature:5.0})
```

### Getting multiple recommendations

In order to get multiple recommendation (or a 'slate') you use `MultiBandit`:

```typescript
import { MultiBandit } from 'simplebandit'

const bandit = MultiBandit.fromActionIds({actionIds:['apple', 'pear', 'banana'], nRecommendations:2})
let recommendations = bandit.makeRecommendation()
bandit.chooseAction(recommendations, 'apple')
//bandit.rejectAll(recommendations)
```

## Usage javascript

There are several pure javascript examples provided in the `examples/` directory:

- `simplest.html`: only actionIds, no debug info
- `simple.html`: adds a lot more debug info to see what's going on under the hood
- `actionfeatures.html`: adds action features.
- `contextfeatures.html`: adds context features
- `multi.html`: multiple recommendations (slate)

## Testing

```sh
npm run test
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
