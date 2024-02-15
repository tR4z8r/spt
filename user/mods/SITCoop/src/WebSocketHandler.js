"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketHandler = void 0;
const ws_1 = __importDefault(require("C:/snapshot/project/node_modules/ws"));
const CoopMatch_1 = require("./CoopMatch");
class WebSocketHandler {
    webSockets = {};
    logger;
    static Instance;
    constructor(webSocketPort, logger) {
        WebSocketHandler.Instance = this;
        this.logger = logger;
        const webSocketServer = new ws_1.default.Server({
            "port": webSocketPort,
            clientTracking: true,
            skipUTF8Validation: true,
            perMessageDeflate: {
                // Other options settable:
                clientNoContextTakeover: true, // Defaults to negotiated value.
                serverNoContextTakeover: true, // Defaults to negotiated value.
                serverMaxWindowBits: 10, // Defaults to negotiated value.
                // Below options specified as default values.
                concurrencyLimit: 10, // Limits zlib concurrency for perf.
                threshold: 1024 // Size (in bytes) below which messages
                // should not be compressed if context takeover is disabled.
            }
        });
        // const pinger = setInterval(function ping() {
        //     webSocketServer.clients.forEach(function each(ws) {
        //     //   if (ws.isAlive === false) return ws.terminate();
        //     //   ws.isAlive = false;
        //       ws.ping();
        //     });
        //   }, 30000);
        webSocketServer.addListener("listening", () => {
            console.log(`=======================================================================`);
            console.log(`COOP MOD: Web Socket Server is listening on ${webSocketPort}`);
            console.log(`A temporary Web Socket Server until SPT-Aki open theirs up for modding!`);
            console.log(`=======================================================================`);
        });
        webSocketServer.addListener("connection", this.wsOnConnection.bind(this));
    }
    wsOnConnection(ws, req) {
        const wsh = this;
        // Strip request and break it into sections
        const splitUrl = req.url.substring(0, req.url.indexOf("?")).split("/");
        const sessionID = splitUrl.pop();
        const ip = req.socket.remoteAddress;
        // get url params
        //const urlParams = this.getUrlParams(req.url);
        ws.on("message", async function message(msg) {
            wsh.processMessage(msg);
        });
        ws.on("close", async (code, reason) => {
            wsh.processClose(ws, sessionID);
        });
        this.webSockets[sessionID] = ws;
        console.log(`${sessionID}:${ip} has connected to SIT WebSocket`);
    }
    TryParseJsonArray(msg) {
        if (msg.charAt(0) === '[') {
            var jsonArray = JSON.parse(msg);
            return jsonArray;
        }
        return undefined;
    }
    async processMessage(msg) {
        const msgStr = msg.toString();
        this.processMessageString(msgStr);
    }
    async processClose(ws, sessionId) {
        // console.log("processClose");
        // console.log(ws);
        console.log(`Web Socket ${sessionId} has disconnected`);
        if (this.webSockets[sessionId] !== undefined)
            delete this.webSockets[sessionId];
    }
    async processMessageString(msgStr) {
        // If is SIT serialized string -- This is NEVER stored.
        if (msgStr.startsWith("SIT")) {
            // console.log(`received ${msgStr}`);
            const messageWithoutSITPrefix = msgStr.substring(3, msgStr.length);
            // const serverId = messageWithoutSITPrefix.substring(0, 24); // get serverId (MongoIds are 24 characters)
            // Post 0.13.5.0.*
            // const serverId = messageWithoutSITPrefix.substring(0, 27); // get serverId post 0.13.5.0.* these are 27 (pmc{Id})
            // Post 0.14.*, yes thats right, we are back to 24 chars again
            const serverId = messageWithoutSITPrefix.substring(0, 24); // get serverId (MongoIds are 24 characters)
            // console.log(`server Id is ${serverId}`);
            // the last chunk will be the method, the ?, and other data
            const messageWithoutSITPrefixes = messageWithoutSITPrefix.substring(24, messageWithoutSITPrefix.length);
            const match = CoopMatch_1.CoopMatch.CoopMatches[serverId];
            if (match !== undefined) {
                // match.ProcessData(messageWithoutSITPrefixes, this.logger);
                const method = messageWithoutSITPrefixes.substring(1, messageWithoutSITPrefixes.indexOf('?'));
                let d = messageWithoutSITPrefixes.substring(messageWithoutSITPrefixes.indexOf('?')).replace('?', '');
                d = d.replace(method, ""); // remove method
                // d = d.substring(1); // remove method length prefix
                const resultObj = { m: method, data: d, fullData: msgStr };
                WebSocketHandler.Instance.sendToWebSockets(match.ConnectedUsers, JSON.stringify(resultObj));
            }
            else {
                console.log(`couldn't find match ${serverId}`);
            }
            return;
        }
        var jsonArray = this.TryParseJsonArray(msgStr);
        if (jsonArray !== undefined) {
            for (const key in jsonArray) {
                this.processObject(jsonArray[key]);
            }
        }
        if (msgStr.charAt(0) !== '{')
            return;
        var jsonObject = JSON.parse(msgStr);
        this.processObject(jsonObject);
    }
    async processObject(jsonObject) {
        const match = CoopMatch_1.CoopMatch.CoopMatches[jsonObject["serverId"]];
        if (match !== undefined) {
            if (jsonObject["connect"] == true) {
                match.PlayerJoined(jsonObject["profileId"]);
            }
            else {
                // console.log("found match");
                match.ProcessData(jsonObject, this.logger);
            }
        }
        else {
            this.sendToAllWebSockets(JSON.stringify(jsonObject));
        }
    }
    sendToAllWebSockets(data) {
        this.sendToWebSockets(Object.keys(this.webSockets), data);
    }
    sendToWebSockets(sessions, data) {
        for (let session of sessions) {
            if (this.webSockets[session] !== undefined) {
                if (this.webSockets[session].readyState === ws_1.default.OPEN) {
                    this.webSockets[session].send(data);
                }
                else {
                    delete this.webSockets[session];
                }
            }
        }
    }
    sendToWebSocketsAsArray(sessions, data) {
        for (let session of sessions) {
            if (this.webSockets[session] !== undefined) {
                if (this.webSockets[session].readyState === ws_1.default.OPEN) {
                    this.webSockets[session].send(data);
                }
                else {
                    delete this.webSockets[session];
                }
            }
        }
    }
    areThereAnyWebSocketsOpen(sessions) {
        for (let session of sessions) {
            if (this.webSockets[session] !== undefined) {
                // if (this.webSockets[session].readyState === WebSocket.OPEN) 
                return true;
            }
        }
        return false;
    }
    closeWebSocketSession(session, reason) {
        if (this.webSockets[session] !== undefined) {
            if (this.webSockets[session].readyState === ws_1.default.OPEN) {
                this.webSockets[session].send(JSON.stringify({ "endSession": true, reason: reason }));
                this.webSockets[session].close();
            }
            delete this.webSockets[session];
        }
    }
    getUrlParams(url) {
        let urlParams = {};
        url.substring(url.indexOf("?") + 1).split("&").forEach(param => {
            const paramSplit = param.split("=");
            urlParams[paramSplit[0]] = paramSplit[1];
        });
        return urlParams;
    }
}
exports.WebSocketHandler = WebSocketHandler;
// class SITWebSocketServer extends WebSocketServer
// {
// }
//# sourceMappingURL=WebSocketHandler.js.map