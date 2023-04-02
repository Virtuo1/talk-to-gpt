import ui from "./modules/ui.js";

if ("webkitSpeechRecognition" in window) {
} else {
    ui.newMessage(
        "system",
        "Speech recognition in your browser is unsupported."
    );
    console.error("Speech recognition in your browser is unsupported.");
}
