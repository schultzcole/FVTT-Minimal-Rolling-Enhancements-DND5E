import { MODULE_TITLE, MODULE_TITLE_SHORT } from "./scripts/const.js";
import { patchItemRollDamage } from "./scripts/itemPatch.js";
import { patchChatLogContextMenu } from "./scripts/chatLogPatch.js";
import { registerSettings } from "./scripts/settings.js";

Hooks.on("setup", () => {
    console.log(`${MODULE_TITLE_SHORT} | Initializing ${MODULE_TITLE}`);
    registerSettings();
    patchItemRollDamage();
    patchChatLogContextMenu();
})
