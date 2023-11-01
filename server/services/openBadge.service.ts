import crypto from "crypto";
import { Readable } from "stream";

import axios from "axios";

const Through = require("stream").PassThrough;

const pngitxt = require("png-itxt");

const openBadgeVerifierURL = "https://openbadgesvalidator.imsglobal.org/results";

export const getBadgeClassById = async (badgeClassId: string): Promise<any> => {
  try {
    const badgeClass = await axios.get(badgeClassId).then((res) => res.data);

    return badgeClass;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const getBadgeClass = async (openBadgeMetadata: any): Promise<any> => {
  try {
    const badgeClass = await axios.get(openBadgeMetadata.badge).then((res) => res.data);

    return badgeClass;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const setOpenBadgeMetadataToImage = async (imageString: string, assertion: any) => {
  const iTXtData = {
    type: "iTXt",
    keyword: "openbadges",
    value: JSON.stringify(assertion),
    language: "",
    translated: "",
    compressed: false,
    compression_type: 0,
  };
  return new Promise<any>(function (resolve, reject) {
    let binaryImage = Buffer.from(imageString, "base64");
    const stream = Readable.from(binaryImage);

    const chunks: Uint8Array[] = [];

    stream
      .pipe(pngitxt.set(iTXtData, true))
      .on("data", (chunk: Uint8Array) => {
        chunks.push(chunk);
      })
      .on("end", () => {
        const uint8ArrayData = new Uint8Array(Buffer.concat(chunks));
        const openBadgesBase64EncodedData = Buffer.from(uint8ArrayData).toString("base64");
        resolve(openBadgesBase64EncodedData);
      })
      .on("error", (err: Error) => {
        console.log("pngitxt Error:", err);
        reject(err);
      });
  });
};

export const extractOpenBadgeMetadataFromImage = (imageString: string) => {
  const file = Buffer.from(imageString, "base64");
  return new Promise<any>(function (resolve, reject) {
    const start = new Through();
    start.pipe(
      pngitxt.get("openbadges", function (err: any, data: any) {
        if (err) {
          reject(err);
        }
        resolve(JSON.parse(data.value));
      }),
    );
    start.write(file);
  });
};

export const validateOpenBadge = async (email: string, openBadgeMetadata: any) => {
  const [, expectedEmailHash] = openBadgeMetadata.recipient.identity.split("$");
  const salt = openBadgeMetadata.recipient.salt;
  let saltVal = salt === null || salt === undefined ? "" : salt;
  const inputEmailHash = crypto
    .createHash("sha256")
    .update(email + saltVal)
    .digest("hex");

  if (inputEmailHash !== expectedEmailHash) {
    return false;
  }

  const { data } = await axios.post(
    openBadgeVerifierURL,
    {
      data: JSON.stringify(openBadgeMetadata),
    },
    {
      headers: {
        Accept: "application/json",
      },
    },
  );
  return data.report.valid;
};
