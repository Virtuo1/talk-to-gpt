class OpenAI {
    #modelId = "";
    #apiKey = "";
    #messages = [];

    get models() {
        return fetch(`https://api.openai.com/v1/models`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
            },
        })
            .then((response) => {
                if (response.ok) return response.json();
                else
                    throw new Error(
                        "Couldn't fetch models, is your OpenAI key correct?"
                    );
            })
            .then((data) => {
                const models = data.data;
                let chatModels = [];

                models.forEach((model) => {
                    chatModels.push(model);
                });
                return data;
            });
    }

    get apiKey() {
        let apiKey = this.#apiKey;
        if (!apiKey) {
            apiKey = localStorage.getItem("openaiApiKey");
            this.#apiKey = apiKey;
        }

        return apiKey;
    }

    set apiKey(value) {
        localStorage.setItem("openaiApiKey", value);
        this.#apiKey = value;
    }

    get modelId() {
        let modelId = this.#modelId;
        if (!modelId) {
            modelId = localStorage.getItem("openaimodelId");
            this.#modelId = modelId;
        }

        return modelId;
    }

    set modelId(value) {
        localStorage.setItem("openaimodelId", value);
        this.#modelId = value;
    }

    chatCompletion(message) {
        this.#messages.push({
            role: "user",
            content: message,
        });

        return fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: this.#messages,
            }),
        })
            .then((response) => {
                if (response.ok) return response.json();
                else throw new Error("Couldn't fetch chat completion");
            })
            .then((data) => {
                this.#messages.push(data.choices[0].message);
                return data.choices[0].message.content;
            })
            .catch((error) => console.log(error));
    }
}

export default new OpenAI();
