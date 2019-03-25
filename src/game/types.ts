type ResetParams = {
  level: number;
  lives: number;
  score: number;
};

type ShouldRestartFunction = () => boolean;

type Controls = {
  direction: number;
};

type CheckControlsFunction = () => Controls;

export { ResetParams, ShouldRestartFunction, CheckControlsFunction };
