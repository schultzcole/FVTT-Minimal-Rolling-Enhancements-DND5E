import { patchItemRollDamage } from "./scripts/itemPatch.js";
import { MODULE_TITLE, MODULE_TITLE_SHORT } from "./scripts/const.js";

Hooks.on("setup", () => {
    console.log(`${MODULE_TITLE_SHORT} | Initializing ${MODULE_TITLE}`);
    patchItemRollDamage();
})
