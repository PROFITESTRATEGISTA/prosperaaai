"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIRealtimeWebSocket = void 0;
const index_1 = require("../../index.js");
const error_1 = require("../../error.js");
const internal_base_1 = require("./internal-base.js");
const detect_platform_1 = require("../../internal/detect-platform.js");
class OpenAIRealtimeWebSocket extends internal_base_1.OpenAIRealtimeEmitter {
    constructor(props, client) {
        super();
        const dangerouslyAllowBrowser = props.dangerouslyAllowBrowser ??
            client?._options?.dangerouslyAllowBrowser ??
            (client?.apiKey.startsWith('ek_') ? true : null);
        if (!dangerouslyAllowBrowser && (0, detect_platform_1.isRunningInBrowser)()) {
            throw new error_1.OpenAIError("It looks like you're running in a browser-like environment.\n\nThis is disabled by default, as it risks exposing your secret API credentials to attackers.\n\nYou can avoid this error by creating an ephemeral session token:\nhttps://platform.openai.com/docs/api-reference/realtime-sessions\n");
        }
        client ?? (client = new index_1.OpenAI({ dangerouslyAllowBrowser }));
        this.url = (0, internal_base_1.buildRealtimeURL)(client, props.model);
        props.onURL?.(this.url);
        // @ts-ignore
        this.socket = new WebSocket(this.url.toString(), [
            'realtime',
            ...((0, internal_base_1.isAzure)(client) ? [] : [`openai-insecure-api-key.${client.apiKey}`]),
            'openai-beta.realtime-v1',
        ]);
        this.socket.addEventListener('message', (websocketEvent) => {
            const event = (() => {
                try {
                    return JSON.parse(websocketEvent.data.toString());
                }
                catch (err) {
                    this._onError(null, 'could not parse websocket event', err);
                    return null;
                }
            })();
            if (event) {
                this._emit('event', event);
                if (event.type === 'error') {
                    this._onError(event);
                }
                else {
                    // @ts-expect-error TS isn't smart enough to get the relationship right here
                    this._emit(event.type, event);
                }
            }
        });
        this.socket.addEventListener('error', (event) => {
            this._onError(null, event.message, null);
        });
        if ((0, internal_base_1.isAzure)(client)) {
            if (this.url.searchParams.get('Authorization') !== null) {
                this.url.searchParams.set('Authorization', '<REDACTED>');
            }
            else {
                this.url.searchParams.set('api-key', '<REDACTED>');
            }
        }
    }
    static async azure(client, options = {}) {
        const token = await client._getAzureADToken();
        function onURL(url) {
            if (client.apiKey !== '<Missing Key>') {
                url.searchParams.set('api-key', client.apiKey);
            }
            else {
                if (token) {
                    url.searchParams.set('Authorization', `Bearer ${token}`);
                }
                else {
                    throw new Error('AzureOpenAI is not instantiated correctly. No API key or token provided.');
                }
            }
        }
        const deploymentName = options.deploymentName ?? client.deploymentName;
        if (!deploymentName) {
            throw new Error('No deployment name provided');
        }
        const { dangerouslyAllowBrowser } = options;
        return new OpenAIRealtimeWebSocket({
            model: deploymentName,
            onURL,
            ...(dangerouslyAllowBrowser ? { dangerouslyAllowBrowser } : {}),
        }, client);
    }
    send(event) {
        try {
            this.socket.send(JSON.stringify(event));
        }
        catch (err) {
            this._onError(null, 'could not send data', err);
        }
    }
    close(props) {
        try {
            this.socket.close(props?.code ?? 1000, props?.reason ?? 'OK');
        }
        catch (err) {
            this._onError(null, 'could not close the connection', err);
        }
    }
}
exports.OpenAIRealtimeWebSocket = OpenAIRealtimeWebSocket;
//# sourceMappingURL=websocket.js.map