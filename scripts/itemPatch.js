import { libWrapper } from "../lib/libWrapper/shim.js";
import { MODULE_NAME } from "./const.js";

export function patchItemRollDamage() {
    libWrapper.register(MODULE_NAME, "CONFIG.Item.entityClass.prototype.rollDamage", async function (wrapped, ...args) {
        console.log("Wrapped Item5e#rollDamage called");

        let {critical=false, /** @type MouseEvent */ event=null, spellLevel=null, versatile=false, options={}} = args[0];

        const optionsOverride = {
            fastForward: !event.altKey,
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
                    flavor: `${CONFIG.DND5E.damageTypes[type]}`,
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
                const damageFlavor = $(`<span class="damage-type">${partOptions.flavor}</span>`);
                rendered.find(".dice-formula").append(damageFlavor);
                renderedRolls.push(rendered);
            }

            // Show DSN 3d dice if available
            if (game.dice3d) await Promise.all(partRolls.map(roll => game.dice3d.showForRoll(roll)));

            // Assemble combined message
            const content = $("<div class=\"mre-damage-card\">");
            content.append(renderedRolls);
            if (itemDamageParts.length > 1) content.find(".dice-roll").addClass(".multi-roll");

            const messageData = {
                user: game.user._id,
                content: content.html(),
                flavor: `${this.name} - ${game.i18n.localize("DND5E.DamageRoll")}`,
                speaker: ChatMessage.getSpeaker({actor: this.actor}),
                "flags.dnd5e.roll": {type: "damage", itemId: this.id },
            };
            if (!game.dice3d) {
                messageData.sound = CONFIG.sounds.dice;
            }
            if (critical) {
                messageData.flavor += ` (${game.i18n.localize("DND5E.Critical")})`;
                messageData["flags.dnd5e.roll"].critical = true;
            }
            mergeObject(messageData, options, { insertKeys: false });
            mergeObject(messageData, options.messageData);

            await ChatMessage.create(messageData);

            // Return the array of Roll objects
            return partRolls;
        }

        return wrapped(...args);
    }, "WRAPPER");
}
