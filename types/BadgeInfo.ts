export class BadgeInfo {
  private _badgeInfo: IfBadgeInfo;

  constructor(ifbadgeInfo: IfBadgeInfo) {
    this._badgeInfo = ifbadgeInfo;
  }

  get badgeName() {
    return this._badgeInfo.name;
  }
}

export interface IfBadgeInfo {
  id: number;
  name: string;
  description: string;
  timecreated: number;
  issuername: string;
  issuerurl: string;
  expiredate?: number;
  message: string;
  uniquehash: string;
  dateissued: number;
  email: string;
  badgeurl: string;
  vcConverted?: boolean;
}

export type WisdomBadgeInfo = {
  name: string;
  description: string;
  image: Image;
  criteria: Criteria;
  issuer: Issuer;
  "@context": string;
  id: string;
  type: string;
  version: string;
  "@language": string;
  alignments: Alignment[];
};

export type KnowledgeBadgeInfo = {
  name: string;
  description: string;
  image: Image;
  criteria: Criteria;
  issuer: Issuer;
  "@context": string;
  id: string;
};

export type Alignment = {
  targetName: string;
  targetUrl: string;
};

type Criteria = {
  id: string;
  narrative: string;
};

type Image = {
  id: string;
  author: string;
};

export type Issuer = {
  name: string;
  url: string;
  email: string;
  "@context": string;
  id: string;
  type: string;
};
