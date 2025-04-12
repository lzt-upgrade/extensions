declare const DOMPurify: {
  sanitize(source: string | Node, options?: any): any;
};

declare namespace XenForo {
  function alert(
    message?: any,
    title?: any,
    timeout?: number | string | null,
    onClose?: () => void,
  ): any;
  function stackAlert(
    message?: any,
    timeout?: number | string | null,
    i?: any,
  ): any;
  function register(selector: string, fn: string): void;
  function Tooltip(jq: JQuery): unknown;

  class scriptLoader {
    static loadScriptAsync(url: string): Promise<void>;
    static loadCssAsync(targets: string[], pattern: string): Promise<void>;
    static loadCss(
      targets: string[],
      link: string,
      // maybe onsuccess cb
      unknown: unknown,
      // maybe onerror cb
      unknown2: unknown,
    ): void;
  }

  const _loadedScripts: Record<string, true>;
  const visitor: {
    language_code: "ru-RU";
    /**
     * @default "rub"
     */
    currency: import("./types/xenforo").Currency;
    /**
     * only authorized users
     */
    ignoredConversations?: unknown[];
    /**
     * @default Language.AUTO
     */
    language_id: import("./types/xenforo").Language;
    /**
     * @default Style.AUTO
     */
    style_id: import("./types/xenforo").Style;
    /**
     * only authorized users
     */
    tc_evercookies?: string[];
    /**
     * only authorized users
     */
    tc_fingerprints?: unknown[];
    /**
     * 0 for unauthorized
     */
    user_id: number;
  };
}

declare module "*.css" {
  const content: string;
  export default content;
}

declare module "__style_helper__" {
  export function injectStyle(text: string, hash: string): void;
}
