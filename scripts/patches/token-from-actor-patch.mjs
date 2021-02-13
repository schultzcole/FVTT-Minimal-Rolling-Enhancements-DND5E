import { libWrapper } from "../../lib/libWrapper/shim.js";
import { MODULE_NAME } from "../const.mjs";
import { initializeFormulaGroups } from "./initialize-formula-groups.mjs";

export function patchTokenFromActor() {
    libWrapper.register(MODULE_NAME, "Token.fromActor", async function patchedFromActor(wrapped, ...args) {
        const [ actor ] = args;

        // If we're creating a token with a synthetic actor, initialize formula groups on the base actor first so that
        // the the created token doesn't immediately try to initialize formula groups and thereby duplicate all of the base actor's item data
        if (!actor.data.token.actorLink) {
            for (let item of actor.items) {
                await initializeFormulaGroups(item);
            }
        }
        return wrapped(...args);
    }, "WRAPPER");
}
