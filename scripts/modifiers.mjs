export const modifiers = { altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, clientX: null, clientY: null };

const updateModifiers = event => {
    modifiers.altKey = event.altKey;
    modifiers.ctrlKey = event.ctrlKey;
    modifiers.metaKey = event.metaKey;
    modifiers.shiftKey = event.shiftKey;
};

document.addEventListener("keydown", updateModifiers);
document.addEventListener("keyup", updateModifiers);
document.addEventListener("mousedown", event => {
    modifiers.clientX = event.clientX;
    modifiers.clientY = event.clientY;
});
document.addEventListener("mouseup", () => {
    modifiers.clientX = null;
    modifiers.clientY = null;
});
