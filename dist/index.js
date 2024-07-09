"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const url_1 = require("url");
const node_cache_1 = __importDefault(require("node-cache"));
const app = (0, express_1.default)();
const port = 3000;
const cache = new node_cache_1.default();
const transformData = (urls) => {
    const uniqueIpAddresses = [];
    const uniquePath = [];
    urls.forEach((url) => {
        const urlParsed = new url_1.URL(url["fileUrl"]);
        const urlIpAddress = urlParsed.hostname;
        const urlPath = urlParsed.pathname;
        if (!uniqueIpAddresses.includes(urlIpAddress)) {
            uniqueIpAddresses.push(urlIpAddress);
            uniquePath.push([]);
        }
        const ipIndex = uniqueIpAddresses.indexOf(urlIpAddress);
        uniquePath[ipIndex].push(urlPath);
    });
    const result = {};
    uniqueIpAddresses.forEach((ip, index) => {
        result[ip] = [];
        uniquePath[index].forEach((path) => {
            const pathParts = path.split("/").filter(Boolean);
            let currentLevel = result[ip];
            pathParts.forEach((part, index) => {
                if (index === pathParts.length - 1) {
                    currentLevel.push(part);
                }
                else {
                    let directory = currentLevel.find((dir) => typeof dir === "object" && dir.hasOwnProperty(part));
                    if (!directory) {
                        directory = { [part]: [] };
                        currentLevel.push(directory);
                    }
                    currentLevel = directory[part];
                }
            });
        });
    });
    return result;
};
app.get("/api/files", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheKey = "api_files";
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
        return res.send(JSON.stringify(cachedData, null, 2));
    }
    try {
        const response = yield axios_1.default.get("https://rest-test-eight.vercel.app/api/test");
        const transformedData = transformData(response.data.items);
        cache.set(cacheKey, transformedData);
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify(transformedData, null, 2));
    }
    catch (error) {
        console.error("Error fetching data:", error);
        if (error.response) {
            res.status(error.response.status).send(error.response.data);
        }
        else {
            res.status(500).send("Error fetching data");
        }
    }
}));
app.listen(port, () => {
    console.log(`Express is listening at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map