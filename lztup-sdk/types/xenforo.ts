export enum Language {
  /**
   * maybe only for unauthorized user
   */
  AUTO = 0,
  ENGLISH = 1,
  RUSSIAN = 2,
}

export enum Style {
  /**
   * maybe only for unauthorized user
   */
  AUTO = 0,
  DEFAULT_2019 = 9,
  DARK_2019 = 41,
  DEFAULT_2024 = 30,
  DARK_2024 = 39,
}

/**
 * @default "rub"
 */
export type Currency =
  | "rub"
  | "uah"
  | "kzt"
  | "bun"
  | "usd"
  | "eur"
  | "gbp"
  | "try"
  | "jpy"
  | "brl";
