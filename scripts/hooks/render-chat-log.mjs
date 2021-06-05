Hooks.on("renderChatLog", (app, html, data) => _handleRenderChatLog(html));
Hooks.on("renderChatPopout", (app, html, data) => _handleRenderChatLog(html));

function _handleRenderChatLog(html) {
    html.on('click', '.card-buttons button', (event) => {
        const button = event.currentTarget;
        const action = button.dataset.action;

        if (action !== "formula-group") return;

        const card = button.closest(".chat-card");
        const messageId = card.closest(".message").dataset.messageId;
        const message = game.messages.get(messageId);

        // Recover the actor for the chat card
        const actor = CONFIG.Item.documentClass._getChatCardActor(card);
        if ( !actor ) return;

        // Get the Item from stored flag data or by the item ID on the Actor
        const storedData = message.getFlag("dnd5e", "itemData");
        const item = storedData ? CONFIG.Item.documentClass.createOwned(storedData, actor) : actor.getOwnedItem(card.dataset.itemId);
        if ( !item ) {
            return ui.notifications.error(game.i18n.format("DND5E.ActionWarningNoItem", {item: card.dataset.itemId, name: actor.name}))
        }

        const spellLevel = parseInt(card.dataset.spellLevel) || null;
        const formulaGroup = button.dataset.formulaGroup;
        item.rollDamage({ event, spellLevel, formulaGroup });
    });
}
