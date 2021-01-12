import { libWrapper } from "../lib/libWrapper/shim.js";
import { MODULE_NAME } from "./const.js";
import { getSettingLocalOrDefault } from "./settings.js";

export function patchItemRollDamage() {
    libWrapper.register(MODULE_NAME, "CONFIG.Item.entityClass.prototype.rollDamage", async function (wrapped, ...args) {
        console.log("Wrapped Item5e#rollDamage called");

        let {critical=false, /** @type MouseEvent */ event=null, spellLevel=null, versatile=false, options={}} = args[0];

        let noFastForwardModifier = getSettingLocalOrDefault("showRollDialogModifier");

        const optionsOverride = {
            fastForward: !event[noFastForwardModifier],
        };

        options = mergeObject(optionsOverride, options, { inplace: false });

        const itemDamageParts = this.data.data.damage.parts;
        if (itemDamageParts.length > 0) {
            const partRolls = [];
            const renderedRolls = [];

            // Roll each of the item's damage parts separately.
            // Store the Roll results in `partRolls`, and the rendered roll html in `renderedRolls`
            for (let [ formula, type ] of itemDamageParts) {
                const partOptions = {
                    parts: [formula],
                    flavor: `${ CONFIG.DND5E.damageTypes[type] ?? CONFIG.DND5E.healingTypes[type] }`,
                    chatMessage: false,
                }
                /** @type Roll */ const roll = await wrapped({
                    critical,
                    event,
                    spellLevel,
                    versatile,
                    options: mergeObject(options, partOptions, { inplace: false })
                });
                if (!roll) continue;
                partRolls.push(roll);

                const rendered = $(await roll.render());
                const formulaElement = rendered.find(".dice-total");
                formulaElement.attr("data-damage-type", partOptions.flavor);
                renderedRolls.push(rendered);
            }

            // Begin assembling combined message
            const content = $("<div class=\"mre-damage-card\">");
            content.append(renderedRolls);

            // This decoy roll is used to convince foundry that the message has ROLL type
            const decoyRoll = new Roll("0").roll();

            // Set up data for the final message to be sent
            const messageData = {
                user: game.user._id,
                content: content.prop("outerHTML"),
                flavor: `${this.name} - ${game.i18n.localize("DND5E.DamageRoll")}`,
                roll: decoyRoll,
                speaker: ChatMessage.getSpeaker({actor: this.actor}),
                type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                "flags.dnd5e.roll": {type: "damage", itemId: this.id },
            };

            if (critical) {
                messageData.flavor += ` (${game.i18n.localize("DND5E.Critical")})`;
                messageData["flags.dnd5e.roll"].critical = true;
            }

            const rollMode = options.rollMode ?? game.settings.get("core", "rollMode");
            ChatMessage.applyRollMode(messageData, rollMode);

            // Merge with data passed into the function call
            mergeObject(messageData, options, { insertKeys: false });
            mergeObject(messageData, options.messageData);

            // Show DSN 3d dice if available
            if (game.dice3d) {
                const rollAnims =
                    partRolls.map(roll => game.dice3d.showForRoll(roll, game.user, true, messageData.whisper, messageData.blind));
                await Promise.race(rollAnims);
            } else {
                messageData.sound = CONFIG.sounds.dice;
            }

            await ChatMessage.create(messageData);

            // Return the array of Roll objects
            return partRolls;
        }

        return wrapped(...args);
    }, "WRAPPER");
}

export function patchItemRollAttack() {

    let noFastForwardModifier = getSettingLocalOrDefault("showRollDialogModifier");
    let advModifier = getSettingLocalOrDefault("advModifier");
    let disAdvModifier = getSettingLocalOrDefault("disAdvModifier");
}
