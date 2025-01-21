import axios from "axios";

import { msEntraRetryConfig } from "@/configs/retry";
import { loggerDebug } from "@/lib/logger";
import { retryRequest } from "@/lib/retryRequest";
import { KeyPair, Signer } from "@/lib/signer";
import { AcquiredIdToken, Manifest, VCRequest } from "@/types";

const manifestURL = process.env.vc_manifest_url;

interface IIssueResponse {
  data: {
    vc: string;
  };
}

export const issue = async (
  vcRequest: VCRequest,
  manifest: Manifest,
  acquiredIdToken: AcquiredIdToken,
  options?: { [key: string]: any },
): Promise<string> => {
  const key = process.env.private_key_jwk;
  const keyObj: KeyPair = JSON.parse(key);

  const signer = new Signer();
  await signer.init(keyObj);

  loggerDebug("wallet did", signer.did);
  loggerDebug(`manifest.display.contract: ${manifest.display.contract}`);
  loggerDebug(`manifestURL: ${manifestURL}`);
  loggerDebug(`credentialIssuer: ${manifest.input.credentialIssuer}`);

  let attestations: any = { ...acquiredIdToken };

  const issueRequestIdToken = await signer.siop({
    aud: manifest.input.credentialIssuer,
    contract: manifest.display.contract || manifestURL,
    attestations,
    pin: options?.pin,
  });

  loggerDebug("issue request id token", issueRequestIdToken);

  const issueResponse = await retryRequest(() => {
    return axios.post<string, IIssueResponse>(manifest.input.credentialIssuer, issueRequestIdToken, {
      headers: { "Content-Type": "text/plain" },
    });
  }, msEntraRetryConfig);

  const vc = issueResponse.data.vc;

  await axios.post(vcRequest.redirect_uri ? vcRequest.redirect_uri : vcRequest.client_id, {
    state: vcRequest.state,
    code: "issuance_successful",
  });

  return vc;
};
