export interface IAction {
  actionId: string;
  features: { [feature: string]: number };
  clickCount?: number;
}

export type IActionsInput =
  | (IAction | string)[]
  | Record<string, string[]>
  | Record<string, Record<string, number>>;

export interface IScoredAction {
  actionId: string;
  score: number;
  probability: number;
}
