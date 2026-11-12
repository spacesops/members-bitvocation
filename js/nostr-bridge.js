(function () {
  if (typeof window.nostr?.getPublicKey === "function") return;

  const REQUEST_TIMEOUT_MS = 25000;

  window.nostr = {
    _requests: {},
    _pubkey: null,
    _pubkeyTimestamp: 0,
    _cacheTimeout: 2000,

    async getPublicKey() {
      const now = Date.now();
      if (this._pubkey && now - this._pubkeyTimestamp < this._cacheTimeout) {
        return this._pubkey;
      }
      this._pubkeyTimestamp = now;
      this._pubkey = await this._call("getPublicKey", {});
      return this._pubkey;
    },

    async signEvent(event) {
      return this._call("signEvent", { event });
    },

    async getRelays() {
      return this._call("getRelays", {});
    },

    nip04: {
      async encrypt(peer, plaintext) {
        return window.nostr._call("nip04.encrypt", { peer, plaintext });
      },
      async decrypt(peer, ciphertext) {
        return window.nostr._call("nip04.decrypt", { peer, ciphertext });
      },
    },

    _call(type, params) {
      const id = Math.random().toString().slice(-8);
      return new Promise((resolve, reject) => {
        const timer = window.setTimeout(() => {
          delete window.nostr._requests[id];
          reject(
            new Error(
              "keys.band did not respond. Install the extension, unlock a profile, and approve this site when prompted.",
            ),
          );
        }, REQUEST_TIMEOUT_MS);

        window.nostr._requests[id] = {
          resolve(value) {
            window.clearTimeout(timer);
            resolve(value);
          },
          reject(err) {
            window.clearTimeout(timer);
            reject(err);
          },
        };

        window.postMessage(
          {
            id,
            ext: "keys.band",
            type,
            params,
          },
          "*",
        );
      });
    },
  };

  window.addEventListener("message", (message) => {
    if (
      !message.data ||
      message.data.response === null ||
      message.data.response === undefined ||
      message.data.ext !== "keys.band" ||
      !window.nostr._requests[message.data.id]
    ) {
      return;
    }

    if (message.data.response.error) {
      const error = new Error(
        "keys.band: " + message.data.response.error.message,
      );
      error.stack = message.data.response.error.stack;
      window.nostr._requests[message.data.id].reject(error);
    } else {
      window.nostr._requests[message.data.id].resolve(message.data.response);
    }

    delete window.nostr._requests[message.data.id];
  });
})();
