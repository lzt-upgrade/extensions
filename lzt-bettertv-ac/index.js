import "./style.css";

if (typeof Lolzteam.ACProvider !== "function") {
  console.log("[BetterTVAC] FroalaEditor isn't loaded");
  return;
}

// слабонервным не смотреть
class BetterTVACProvider extends Lolzteam.ACProvider {
  constructor(froala) {
    super(froala, "BetterTV");
    this.froala = froala;
    this.apiUrl = "https://api.betterttv.net/3/";
    this.cdnUrl = "https://cdn.betterttv.net/";
    this.limit = 5;

    this.debounceTime = 300;
  }

  debounceShow(text) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(async () => {
      let results = await this.searchSmilies(
        text[0] === ":" ? text.slice(1) : text,
      );
      if (!results?.length) {
        return false;
      }

      this.state = {
        text,
        textNode: this.froala.selection.get().anchorNode,
      };

      this.popup.html("");

      const prioritySmilies = $(
        ".fe-ac-smilie > .fe-ac-smilie-result",
      ).toArray();
      for (const prioritySmilie of prioritySmilies) {
        $(prioritySmilie).appendTo(this.popup);
      }

      for (const result of results) {
        if (this.popup.find(".fe-ac-smilie-result").length >= this.limit) {
          continue;
        }

        $('<div class="fe-ac-smilie-result fe-ac-result"/>')
          .append(
            $("<img/>", {
              // mceSmilie тут не использовать! Он превращается в текст при копирование
              class: "fe-ac-smilie-image fr-draggable lztup-smilie",
              alt: result.name,
              title: result.name,
              src: result.image,
              // style: "user-select: auto !important;",
            }),
          )
          .appendTo(this.popup);
      }
      this.debounceTimeout = null;

      this.showPopup();
    }, this.debounceTime);
  }

  async searchSmilies(text) {
    if (text.length < 3) {
      return [];
    }

    try {
      const res = await fetch(
        `${this.apiUrl}emotes/shared/search?query=${text}&offset=0&limit=${this.limit}`,
      );

      const data = await res.json();
      return data.map((smilie) => ({
        aliases: [],
        image: `${this.cdnUrl}emote/${smilie.id}/1x.webp`,
        name: smilie.code,
        value: `:${smilie.code}:`,
      }));
    } catch (err) {
      console.error(
        `[BetterTVAC] Failed to search BetterTV smilies by text: ${err.message}`,
      );
    }
  }

  async trigger() {
    let text = this.getSelectedText(", ");
    let selectedNode = this.froala.selection.get().anchorNode;
    let previousSibling =
      selectedNode.previousSibling || selectedNode.parentNode.previousSibling;

    selectedNode = selectedNode?.cloneNode(true);
    previousSibling = previousSibling?.cloneNode(true);

    if (
      !text ||
      text.indexOf("@") !== -1 ||
      (selectedNode.textContent.startsWith(text) &&
        previousSibling &&
        previousSibling?.textContent.length !== 0 &&
        !previousSibling?.textContent.endsWith(" "))
    ) {
      return false;
    }

    text = text?.trim();

    // скрываем уже существующий попап чтобы при ожидание он не висел
    this.hide();
    this.debounceShow(text);

    return true;
  }

  insertResult() {
    if (!this.popup.find(".active").length) {
      this.hide();
      return false;
    }

    this.froala.selection.save();
    this.state.textNode.textContent = this.state.textNode.textContent
      .trimEnd()
      .slice(0, -this.state.text.length);
    this.froala.selection.restore();
    // this.froala.html.insert(
    //   '&nbsp;<smilie class="fr-deletable">'.concat(
    //     this.popup.find(".active").html(),
    //     "</smilie> ",
    //   ),
    // );
    // $("smilie").attr("contenteditable", "false");
    this.froala.html.insert(this.popup.find(".active").html());

    $("#lzt-fe-eb-smilie").trigger("ac-picked-smilie");

    this.hide();
    return true;
  }
}

class CustomEditorAutoCompleter extends Lolzteam.EditorAutoCompleter {
  constructor(el, n, froala) {
    super(el, n, froala);
    this.froala = froala;
    this.providers = [new BetterTVACProvider(froala)];

    froala.events.on("keydown", this.onKeydown.bind(this), true);
    froala.events.on("keyup", this.onKeyup.bind(this), true);
    froala.events.on("focus", this.onFocus.bind(this), true);
  }
}

function registerBetterTVAC(froala) {
  new CustomEditorAutoCompleter(froala.$el, { insertMode: "html" }, froala);
}

FroalaEditor.MODULES.smilieBetterTVAC = function (e) {
  return {
    _init: registerBetterTVAC(e),
  };
};
