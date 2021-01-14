import { libWrapper } from "../../lib/libWrapper/shim.js";
import { MODULE_NAME } from "../const.js";

export function patchChatLogContextMenu() {
    libWrapper.register(MODULE_NAME, "ChatLog.prototype._contextMenu", function (wrapped, ...args) {
        let canApply = li => {
            const message = game.messages.get(li.closest(".chat-message").data("messageId"));
            return message.isContentVisible && canvas.tokens.controlled.length;
        };
        const contextOptions = [
            {
                name: game.i18n.localize("DND5E.ChatContextDamage"),
                icon: "<i class=\"fas fa-user-minus\"></i>",
                condition: canApply,
                callback: li => applyChatCardDamage(li, 1),
            },
            {
                name: game.i18n.localize("DND5E.ChatContextHealing"),
                icon: "<i class=\"fas fa-user-plus\"></i>",
                condition: canApply,
                callback: li => applyChatCardDamage(li, -1),
            },
            {
                name: game.i18n.localize("DND5E.ChatContextDoubleDamage"),
                icon: "<i class=\"fas fa-user-injured\"></i>",
                condition: canApply,
                callback: li => applyChatCardDamage(li, 2),
            },
            {
                name: game.i18n.localize("DND5E.ChatContextHalfDamage"),
                icon: "<i class=\"fas fa-user-shield\"></i>",
                condition: canApply,
                callback: li => applyChatCardDamage(li, 0.5),
            },
        ];
        new ContextMenu(args[0], ".mre-damage-card .dice-result", contextOptions);
        return wrapped(...args);
    }, "WRAPPER");
}

function applyChatCardDamage(roll, multiplier) {
    const amount = roll.find('.dice-total').text();
    return Promise.all(canvas.tokens.controlled.map(t => {
        const a = t.actor;
        return a.applyDamage(amount, multiplier);
    }));
}
