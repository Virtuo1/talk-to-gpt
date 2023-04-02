import elevenlabs from "./elevenlabs.js";
import openAI from "./openai.js";

class UI {
    #recordingButton = document.getElementById("recordingButton");
    #messageDiv = document.getElementById("responseDiv");
    #modelSelector = document.getElementById("modelSelector");
    #voiceSelector = document.getElementById("voiceSelector");
    #audioPlayer = document.getElementById("audioPlayer");
    #settings = document.getElementById("settings");
    #settingsAccept = document.getElementById("settingsAccept");
    #openSettings = document.getElementById("openSettings");
    #openaiApiKey = document.getElementById("openaiApiKey");
    #elevenlabsApiKey = document.getElementById("elevenlabsApiKey");

    #isReady = false;
    #talkingToAI = false;

    constructor(mainFunc) {
        this.populateVoiceList();
        this.populateModelList();

        this.#voiceSelector.onchange = (event) => {
            elevenlabs.voiceId = event.target.value;
        };

        this.#modelSelector.onchange = (event) => {
            openAI.modelId = event.target.value;
        };

        this.#recordingButton.onclick = this.startRecording.bind(this);

        this.#settingsAccept.onclick = this.closeSettings.bind(this);

        this.#openSettings.onclick = this.openSettings.bind(this);
    }

    #setTalking(isTalking) {
        this.#recordingButton.innerText = isTalking ? "Stop" : "Record";
        this.#talkingToAI = isTalking;
    }

    #ready() {
        this.#isReady = true;
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(audioPlayer);
        source.connect(audioContext.destination);

        this.#audioPlayer.onloadedmetadata = () => audioPlayer.play();
    }

    async mainLoop() {
        while (this.#talkingToAI) {
            let transcript = await this.listen();

            // Don't continue with chat completion if user has stopped recording
            if (!this.#talkingToAI) return;

            this.newMessage("user", transcript);

            let response = await openAI.chatCompletion(transcript);
            this.newMessage("ai", response);

            await elevenlabs.textToSpeak(response, this.#audioPlayer);
        }
    }

    async listen() {
        return new Promise((resolve, reject) => {
            const recognition = new webkitSpeechRecognition();
            recognition.lang = "en-US";
            recognition.maxAlternatives = 1;
            recognition.interimResults = false;
            recognition.continuous = true;
            recognition.maxSpeechInputTime;

            recognition.start();

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                recognition.stop();
                resolve(transcript);
            };

            recognition.onerror = (event) => {
                recognition.stop();
                setTalking(false);
                reject("stopped speaking");
            };
        });
    }

    async populateVoiceList() {
        this.#voiceSelector.innerHTML = "";

        let voices;
        try {
            voices = await elevenlabs.voices;
        } catch (error) {
            return this.newMessage("system", error);
        }

        let selectedVoice = elevenlabs.voiceId;

        for (let i = 0; i < voices.length; i++) {
            const option = document.createElement("option");
            const voice = voices[i];

            if (selectedVoice == voice.voice_id) option.selected = true;

            option.textContent = `${voice.name}`;
            option.setAttribute("value", voice.voice_id);
            this.#voiceSelector.appendChild(option);
        }

        if (!selectedVoice) {
            this.#voiceSelector.options[0].selected = true;
            elevenlabs.voiceId = this.#voiceSelector.options[0].value;
        }
    }

    async populateModelList() {
        this.#modelSelector.innerHTML = "";

        let models;
        try {
            models = await openAI.models;
        } catch (error) {
            return this.newMessage("system", error);
        }

        let selectedModel = openAI.modelId;

        for (let i = 0; i < models.data.length; i++) {
            const model = models.data[i];

            if (!model.id.includes("gpt")) continue;

            const option = document.createElement("option");

            if (selectedModel == model.id) option.selected = true;

            option.textContent = `${model.id}`;
            option.setAttribute("value", model.id);
            this.#modelSelector.appendChild(option);
        }

        if (!selectedModel) {
            this.#modelSelector.options[0].selected = true;
            openAI.modelId = this.#modelSelector.options[0].value;
        }
    }

    newMessage(type, message) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message", type);
        messageElement.innerText = message;
        this.#messageDiv.insertBefore(messageElement, responseDiv.firstChild);
    }

    openSettings() {
        this.#openaiApiKey.value = openAI.apiKey;
        this.#elevenlabsApiKey.value = elevenlabs.apiKey;

        this.#settings.style.display = "block";
    }

    closeSettings() {
        openAI.apiKey = this.#openaiApiKey.value;
        elevenlabs.apiKey = this.#elevenlabsApiKey.value;

        this.populateVoiceList();
        this.populateModelList();

        this.#settings.style.display = "none";
    }

    startRecording() {
        if (!this.#isReady) this.#ready();

        // Toggle talkingToAI
        if (this.#talkingToAI) {
            this.#setTalking(false);
        } else {
            this.#setTalking(true);
            this.mainLoop();
        }
    }
}

export default new UI();
