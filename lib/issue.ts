import axios from "axios";

import { Signer } from "./signer";
import { decodeJWTToVCData } from "./utils";
import { AcquiredIdToken, Manifest, VCRequest } from "../types";

interface Descriptor {
  id?: string;
  path?: string;
  encoding?: string;
  format?: string;
  path_nested?: {
    id?: string;
    format?: string;
    path?: string;
  };
}

interface IIssueResponse {
  data: {
    vc: string;
  };
}

export const issue = async (
  signer: Signer,
  vcRequest: VCRequest,
  manifest: Manifest,
  acquiredIdToken: AcquiredIdToken,
  options?: { [key: string]: any },
): Promise<void> => {
  let attestations: any = { ...acquiredIdToken };

  const issueRequestIdToken = await signer.siop({
    aud: manifest.input.credentialIssuer,
    contract: manifest.display.contract,
    attestations,
    pin: options?.pin,
  });
  console.log("issueRequestIdToken", issueRequestIdToken);

  const issueResponse = await axios.post<string, IIssueResponse>(manifest.input.credentialIssuer, issueRequestIdToken, {
    headers: { "Content-Type": "text/plain" },
  });
  const vc = issueResponse.data.vc;
  const vcDecodedData = decodeJWTToVCData(vc);
  console.log("length", vc.length);

  const complete = await axios.post(vcRequest.redirect_uri ? vcRequest.redirect_uri : vcRequest.client_id, {
    state: vcRequest.state,
    code: "issuance_successful",
  });
  console.log("final", complete);
};
