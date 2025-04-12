import "./report-icons.scss";
import reasons from "./reasons";

XenForo.LZTUpgradeReportsIcons = function ($target: JQuery) {
  const $reasonsEls = $target.find("> label");
  for (const [name, reason] of Object.entries(reasons)) {
    const selector = [...reason.ru, ...reason.en]
      .filter(Boolean)
      .map((phrase) => `.labelauty-unchecked:contains("${phrase}")`)
      .join(", ");
    $reasonsEls
      .find(selector)
      .parent()
      .find(".labelauty-unchecked-image, .labelauty-checked-image")
      .addClass(`lztup-report-${name}`);
  }
};

XenForo.register(".reportReasons", "XenForo.LZTUpgradeReportsIcons");
