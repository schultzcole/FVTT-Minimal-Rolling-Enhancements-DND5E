import { libWrapper } from "../../lib/libWrapper/shim.js";
import { MODULE_NAME } from "../const.js";
import { initializeFormulaGroups } from "./initialize-formula-groups.js";

export function patchItemSheetGetData() {
    libWrapper.register(MODULE_NAME, "game.dnd5e.applications.ItemSheet5e.prototype.getData", async function patchedGetData(wrapped, ...args) {
        if (this.isEditable) await initializeFormulaGroups(this.entity);
        return wrapped(...args);
    }, "WRAPPER");
}
