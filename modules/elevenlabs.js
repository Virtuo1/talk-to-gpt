class Elevenlabs {
    #voiceId = "";
    #apiKey = "";

    get voices() {
        return fetch(`https://api.elevenlabs.io/v1/voices`, {
            method: "GET",
            headers: {
                "xi-api-key": this.apiKey,
            },
        })
            .then((response) => {
                if (response.ok) return response.json();
                else
                    throw new Error(
                        "Couldn't fetch voices, is your elevenlabs key correct?"
                    );
            })
            .then((data) => {
                return data.voices;
            });
    }

    get apiKey() {
        let apiKey = this.#apiKey;
        if (!apiKey) {
            apiKey = localStorage.getItem("elevenlabsApiKey");
            this.#apiKey = apiKey;
        }

        return apiKey;
    }

    set apiKey(value) {
        localStorage.setItem("elevenlabsApiKey", value);
        this.#apiKey = value;
    }

    get voiceId() {
        let voiceId = this.#voiceId;
        if (!voiceId) {
            voiceId = localStorage.getItem("elevenlabsVoiceId");
            this.#voiceId = voiceId;
        }

        return voiceId;
    }

    set voiceId(value) {
        localStorage.setItem("elevenlabsVoiceId", value);
        this.#voiceId = value;
    }

    async textToSpeak(message, targetPlayer) {
        // Splits paragraph into sentences by seperating string by .;!? followed by a whitespace
        const sentences = message.split(/(?<=[.;!?])\s+/);

        const response = await this.#fetchAudio(sentences[0]);
        await this.#playSentences(targetPlayer, response, sentences, 0);
    }

    async #playSentences(player, audioBlobURL, sentences, i) {
        player.src = audioBlobURL;

        // Fetch audio for next iteration
        let nextAudioBlobURL =
            i + 1 < sentences.length
                ? await this.#fetchAudio(i + 1)
                : undefined;

        await new Promise((resolve, reject) => {
            player.addEventListener(
                "ended",
                async () => {
                    if (i + 1 < sentences.length && nextAudioBlobURL) {
                        await this.#playSentences(
                            nextAudioBlobURL,
                            sentences,
                            i + 1
                        );
                    }
                    resolve();
                },
                { once: true }
            );
        }, i);
    }

    #fetchAudio(message) {
        return fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "xi-api-key": this.apiKey,
                },
                body: JSON.stringify({
                    text: message,
                    voice_settings: {
                        stability: 0,
                        similarity_boost: 0,
                    },
                }),
            }
        )
            .then((response) => {
                if (response.ok) return response.blob();
                else throw new Error("Couldn't fetch audio");
            })
            .then((blob) => URL.createObjectURL(blob));
    }
}

export default new Elevenlabs();
