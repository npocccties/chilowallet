export const pagePath = {
  wallet: {
    list: "/",
    add: "/wallet/add",
    detail: "/wallet/detail",
  },
  badge: {
    import: "/badge/import",
  },
  submission: {
    enter: "/submission",
    confirm: "/submission/confirm",
  },
} as const;

export const sessionStorageKey = {
  confirmCode: "confirmCode",
  submissionEmail: "submissionEmail",
  consumer: "consumer",
  badgeVc: "badgeVc",
} as const;

export const submissionResult = {
  success: 0,
  badReqestOther: 100,
  badEmailAddress: 101,
  verifyBadgeNG: 102,
  verifyVcNG: 103,
  serverError: 200,
};
