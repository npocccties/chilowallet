import issuanceConfig from "@/templates/issuance_request_config.json";

const did_authority = process.env.did_authority as string;
const clientName = process.env.clientName as string;

const msal = require("@azure/msal-node");

const msalConfig = {
  auth: {
    clientId: process.env.vcApp_client_id as string,
    authority: "https://login.microsoftonline.com/" + process.env.vcApp_azTenantId,
    clientSecret: process.env.vcApp_client_secret as string,
  },
};
const msalCca = new msal.ConfidentialClientApplication(msalConfig);
const msalClientCredentialRequest = {
  scopes: ["3db474b9-6a0c-4840-96ac-1fceb342124f/.default"],
  skipCache: false,
};

/**
 * issueRequestとの違いは  const { data } = await axios.get(openBadgeMetadata.badge);　がないだけ
 * @param manifestId
 * @param badgeClass
 * @param email
 * @param sessionId
 * @param base64ImageWithoutPrefix
 * @returns
 */
export const issueRequest = async (
  manifestId: string,
  badgeClass: any,
  verificationURL: string,
  email: string,
  sessionId: string,
  base64ImageWithoutPrefix: string,
  issuedOn: string,
  expires: string,
) => {
  console.log(`### START issueRequest sessionId:${sessionId}###`);
  console.log(`issuedOn = ${issuedOn},expores=${expires}`);

  let accessToken = "";
  try {
    const result = await msalCca.acquireTokenByClientCredential(msalClientCredentialRequest);
    if (result) {
      accessToken = result.accessToken;
    }
  } catch (e) {
    console.log("failed to get access token");
    console.log(e);
  }

  const pin = Math.floor(1000 + Math.random() * 9000);

  issuanceConfig.pin.value = pin.toString();
  issuanceConfig.claims.photo = base64ImageWithoutPrefix;
  issuanceConfig.claims.email = email;
  issuanceConfig.claims.verificationURL = verificationURL;
  issuanceConfig.claims.issued = issuedOn;
  issuanceConfig.claims.expire = expires;

  const openbadgeInfo = JSON.stringify(badgeClass);

  issuanceConfig.claims.openbadge = openbadgeInfo;

  issuanceConfig.registration.clientName = clientName;
  issuanceConfig.authority = did_authority;

  // callback urlの指定
  if (process.env.baseURL === "http://localhost:3000") {
    issuanceConfig.callback.url = "https://example.com/api/issuer/issuance-request-callback"; // localhostだとAPI実行でエラーになるため、ダミー
  } else {
    const callbakURL = `${process.env.baseURL}/api/issuer/issuance-request-callback`;
    issuanceConfig.callback.url = callbakURL;
    console.log("callbackURL =", callbakURL);
  }

  // セッションidを入れてコールバック側へ引き継ぐ
  issuanceConfig.callback.state = sessionId;
  issuanceConfig.manifest = manifestId;

  const payload = JSON.stringify(issuanceConfig);

  const fetchOptions = {
    method: "POST",
    body: payload,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  };

  const client_api_request_endpoint =
    "https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/createIssuanceRequest";
  let url = "";
  try {
    const response = await fetch(client_api_request_endpoint, fetchOptions);
    const resp = await response.json();
    if (resp.error) {
      console.log("failed createIssuanceRequest:", resp.error);
    }
    console.log(resp);
    url = resp.url;
    console.log("url =", url);
  } catch (e) {
    console.log("ERROR END:", e);
  }

  console.log("### END issueRequest ###");

  return { pin, url, sessionId };
};
