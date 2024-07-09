import express from "express";
import axios from "axios";
import { URL } from "url";
import NodeCache from "node-cache";

const app = express();
const port = 3000;
const cache = new NodeCache();

type DataStructure = {
  [ip: string]: (string | { [subDir: string]: string[] })[];
};

const transformData = (urls: any[]): DataStructure => {
  const uniqueIpAddresses: string[] = [];
  const uniquePath: string[][] = [];

  urls.forEach((url) => {
    const urlParsed = new URL(url["fileUrl"]);
    const urlIpAddress = urlParsed.hostname;
    const urlPath = urlParsed.pathname;

    if (!uniqueIpAddresses.includes(urlIpAddress)) {
      uniqueIpAddresses.push(urlIpAddress);
      uniquePath.push([]);
    }

    const ipIndex = uniqueIpAddresses.indexOf(urlIpAddress);
    uniquePath[ipIndex].push(urlPath);
  });

  const result: DataStructure = {};

  uniqueIpAddresses.forEach((ip, index) => {
    result[ip] = [];

    uniquePath[index].forEach((path) => {
      const pathParts = path.split("/").filter(Boolean);
      let currentLevel: (string | { [key: string]: any[] })[] = result[ip];

      pathParts.forEach((part, index) => {
        if (index === pathParts.length - 1) {
          currentLevel.push(part);
        } else {
          let directory = currentLevel.find(
            (dir) => typeof dir === "object" && dir.hasOwnProperty(part)
          ) as { [key: string]: any[] };

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

app.get("/api/files", async (req, res) => {
  const cacheKey = "api_files";
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return res.send(JSON.stringify(cachedData, null, 2));
  }
  try {
    const response = await axios.get(
      "https://rest-test-eight.vercel.app/api/test"
    );

    const transformedData = transformData(response.data.items);

    cache.set(cacheKey, transformedData);

    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(transformedData, null, 2));
  } catch (error) {
    console.error("Error fetching data:", error);
    if (error.response) {
      res.status(error.response.status).send(error.response.data);
    } else {
      res.status(500).send("Error fetching data");
    }
  }
});

app.listen(port, () => {
  console.log(`Express is listening at http://localhost:${port}`);
});
