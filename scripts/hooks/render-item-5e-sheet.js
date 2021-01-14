import { MODULE_NAME } from "../const.js";
import { DamageGroupConfig } from "../apps/damage-group-config.js";

Hooks.on("renderItemSheet5e", (itemSheet, html, _) => {
    const tooltip = game.i18n.localize(`${MODULE_NAME}.DAMAGE-GROUP.DialogTitle`);
    html.find(".tab.details .damage-header").prepend(`<a title="${tooltip}" class="config-damage-groups"><i class="fas fa-tasks"></i></a>`);

    html.find(".config-damage-groups").click(() => new DamageGroupConfig(itemSheet.entity, { editable: itemSheet.isEditable }).render(true) );
});
