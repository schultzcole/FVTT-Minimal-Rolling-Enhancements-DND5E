import { MODULE_TITLE, MODULE_TITLE_SHORT } from "./scripts/const.js";
import { patchChatLogContextMenu } from "./scripts/patches/chat-log-patch.js";
import { patchAbilityChecks } from "./scripts/patches/ability-check-patches.js";
import { patchItemBaseRoll } from "./scripts/patches/item-base-roll-patch.js";
import { patchItemRollDamage } from "./scripts/patches/item-damage-patch.js";
import { patchItemPrepareData } from "./scripts/patches/item-prepare-data-patch.js";
import { registerSettings } from "./scripts/settings.js";

Hooks.on("setup", () => {
    console.log(`${MODULE_TITLE_SHORT} | Initializing ${MODULE_TITLE}`);
    registerSettings();
    patchAbilityChecks();
    patchItemBaseRoll()
    patchItemRollDamage();
    patchItemPrepareData();
    // TODO Having some trouble getting the context menus to work, will revisit
    patchChatLogContextMenu();
});
