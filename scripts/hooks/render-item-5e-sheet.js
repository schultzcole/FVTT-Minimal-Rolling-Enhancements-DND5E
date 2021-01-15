import { MODULE_NAME } from "../const.js";
import { DamageGroupConfig } from "../apps/damage-group-config.js";
import { initializeDamageGroups } from "../patches/initialize-damage-groups.js";

Hooks.on("renderItemSheet5e", (itemSheet, html, _) => {
    if (itemSheet.isEditable) {
        // It is ok to ignore the promise here; I'd rather not make this hook handler async
        // noinspection JSIgnoredPromiseFromCall
        initializeDamageGroups(itemSheet.entity);
    }

    const tooltip = game.i18n.localize(`${MODULE_NAME}.DAMAGE-GROUP.DialogTitle`);
    html.find(".tab.details .damage-header").prepend(`<a title="${tooltip}" class="config-damage-groups"><i class="fas fa-tasks"></i></a>`);

    html.find(".config-damage-groups").click(() => new DamageGroupConfig(itemSheet.entity, { editable: itemSheet.isEditable }).render(true) );

    html.find(`.tab.details input[name="data.damage.versatile"]`).closest(".form-group").remove();
});
