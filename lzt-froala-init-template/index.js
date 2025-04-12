if (typeof FroalaEditor !== "function") {
  console.log("[lztup] FroalaEditor isn't loaded");
  return;
}

const XF_LANG = XenForo?.visitor?.language_id === 1 ? "en" : "ru";
const i18n = {
  ru: {
    templates: "Шаблоны",
    create_template: "Создать шаблон",
    no_templates: "Вы пока что не добавили ни одного шаблона",
  },
  en: {
    templates: "Templates",
    create_template: "Create a template",
    no_templates: "You have not added any templates",
  },
  get(phrase) {
    return this[XF_LANG]?.[phrase] ?? phrase;
  },
};

class GM_Template {
  static key = "conversation_templates";

  static remove(id) {
    if (Number.isNaN(id)) {
      return;
    }

    const templates = GM_Template.get();
    GM_setValue(
      GM_Template.key,
      templates.filter((template) => template.id !== id),
    );
  }

  static get() {
    return GM_getValue(GM_Template.key, []);
  }

  static push(templateData) {
    const templates = GM_Template.get();
    templates.push(templateData);
    GM_setValue(GM_Template.key, templates);
  }

  static set(templatesData) {
    GM_setValue(GM_Template.key, templatesData);
  }
}

function getTemplateItemsContent() {
  // if u know how to get actual templates without parsing any thread page - pm me
  const templates = GM_Template.get();
  return templates
    .map((template) => {
      const { id, title, content, contentHtml } = template;
      return `
      <div id="ctemplate-${id}" class="template">
        <div class="actions">
          <a class="templateIcon editIcon fas fa-pen OverlayTrigger" href="conversations/template?template_id=${id}"></a>
          <a class="templateIcon deleteIcon DeleteTemplate fas fa-trash-alt" href="conversations/template/delete?template_id=${id}"></a>
        </div>

        <div class="InsertTemplate">
          <div class="title bold">${title}</div>
          <div class="content">${content}</div>
          <div class="ContentHtml dnone">${contentHtml}</div>
        </div>
      </div>`;
    })
    .join("\n");
}

function registerAlwaysInitTemplate(froala) {
  const $parent = $(froala.$box.parent());
  if ($parent.find(".js-lzt-fe-extraButtons").length) {
    console.log("[lztup] templates button already exists");
    return;
  }

  XenForo.scriptLoader.loadCss(
    ["conversation"],
    `css.php?css=__sentinel__&style=${XenForo.visitor.style_id}&_v=${XenForo._jsVersion}`,
  );

  const $lztTemplateBtn = $(`
    <div id="lztup-fe-lztTemplate" type="button" tabindex="-1" role="button" aria-haspopup="true" class="fr-command fr-btn" data-cmd="lztTemplate" title="${i18n.get(
      "templates",
    )}">
      <i class="fal fa-drafting-compass" aria-hidden="true"></i>
    </div>`);
  const templateItemsContent = getTemplateItemsContent();
  const $lztTemplateBox = $(`
    <div style="display: none">
			<div id="ConversationTemplates" class="ConversationTemplates conversationTemplatesBox">
				<div class="header">
					<span class="title bold">${i18n.get("templates")}</span>
					<div class="fl_r">
						<a href="conversations/template" class="OverlayTrigger">${i18n.get(
              "create_template",
            )}</a>
					</div>
				</div>
				<div id="ConversationTemplateList" class="templateList">${templateItemsContent}</div>
				<div class="NoTemplates noConversationTemplates muted">${i18n.get(
          "no_templates",
        )}</div>
      </div>
		</div>`);

  if (templateItemsContent.length) {
    $lztTemplateBox.find(".NoTemplates").hide();
  }

  $(froala.$tb.find(".fr-float-right").first()).append($lztTemplateBtn);
  $parent.append($lztTemplateBox);

  const $templatesBox = $("#ConversationTemplates").clone();
  if (!$templatesBox.length) {
    return;
  }

  $templatesBox.data("lzt-fe-ed", froala);
  $lztTemplateBtn.data("tippy-content", $templatesBox[0]);
  XenForo.tippy(
    $lztTemplateBtn[0],
    {
      content: $templatesBox[0],
      onShown: function () {
        $templatesBox.xfActivate();
      },
      onShow() {
        froala.selection.save();
      },
      onHide() {
        froala.selection.restore();
      },
      boundary: "window",
    },
    "popup",
  );
}

FroalaEditor.MODULES.alwaysInitTemplate = function (e) {
  return {
    _init: registerAlwaysInitTemplate(e),
  };
};

const getJQText = ($el, selector) => {
  return $el.find(selector).text().trim();
};

const parseTemplateId = ($el) =>
  parseInt($el.attr("id")?.replace("ctemplate-", ""));

function parseTemplateItem($el) {
  const id = parseTemplateId($el);
  if (Number.isNaN(id)) {
    return null;
  }

  return {
    id,
    title: getJQText($el, ".title.bold"),
    content: getJQText($el, ".content"),
    contentHtml: getJQText($el, ".ContentHtml"),
  };
}

function saveTemplatesToGM(froala) {
  const $parent = $(froala.$box.parent());
  if (
    !$parent.find(".js-lzt-fe-extraButtons > #lzt-fe-eb-lztTemplate").length
  ) {
    console.log("[lztup] extra template buttons not found");
    return;
  }

  const $templateListItems = $parent.find(
    "#ConversationTemplates > #ConversationTemplateList > .template",
  );
  if (!$templateListItems.length) {
    console.log("[lztup] templates list items not found");
    return;
  }

  const templateList = Array.from($templateListItems)
    .map((el) => parseTemplateItem($(el)))
    .filter(Boolean);

  GM_Template.set(templateList);
}

FroalaEditor.MODULES.saveTemplatesToGM = function (e) {
  return {
    _init: saveTemplatesToGM(e),
  };
};

XenForo.LZTUpgradeConversationTemplateDelete = function ($button) {
  $button.on("click", (e) => {
    e.preventDefault();
    const $template = $button.closest(".template");
    const id = parseTemplateId($template);
    GM_Template.remove(id);
  });
};

XenForo.LZTUpgradeConversationTemplatesCreate = function ($form) {
  $form.on("AutoValidationComplete", (e) => {
    e.preventDefault();
    const $template = $(e.ajaxData.templateHtml);
    const id = parseTemplateId($template);
    if (e.ajaxData.templateUpdated) {
      GM_Template.remove(id);
    }

    const templateData = parseTemplateItem($template);
    GM_Template.push(templateData);
  });
};

XenForo.register(
  ".DeleteTemplate",
  "XenForo.LZTUpgradeConversationTemplateDelete",
);
XenForo.register(
  "#ConversationTemplateCreateForm",
  "XenForo.LZTUpgradeConversationTemplatesCreate",
);
