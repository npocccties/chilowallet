export const errors = {
  response400: {
    label: "400: Bad Request",
    message: "リクエストエラーが発生しました。",
    detail: {
      body: "bodyの値が不正です。",
      param: "パラメータが不正です。",
    },
  },
  response500: {
    label: "500: Internal Server Error",
    message: "サーバー側の処理中にエラーが発生しました。",
  },
  unexpectedError: {
    label: "Un Expected Error",
    message: "予期せぬエラーが発生しました。管理者へお問い合わせください。",
  },
  unAuthrizedError: {
    label: "Un Authrized Error",
    message: "認証情報が確認できませんでした。ログインし直してください。",
    detail: {
      noSession: "no session error",
    },
  },
  vcImportFailed: "バッジのインポートに失敗しました。",
  validation: {
    email: "eメールアドレスが不正な値です。",
    openBadge: "Open Badgeの検証に失敗しました。",
  },
  moodleErrorCode: {
    invalidLogin: "invalidlogin",
  },
  E10000: "E10000", // LMSからユーザ情報が取得できない
  E10001: "E10001", // LMSからコース一覧が取得できない
  E10002: "E10002", // LMSからバッジ一覧が取得できない
  E10003: "E10003", // LMSにバッジのメタデータがない
  E20001: "E20001", // コースと紐づくバッジがポータルにない
  // E20002: "E20002", // ポータルのバッジと同じバッジがLMSにない
  E20003: "E20003", // ウォレットDBにウォレットが存在しない
  E29999: "E29999", // ウォレットサーバにて予期せぬ例外が発生
  E30000: "E30000", // ポータルからバッジ一覧が取得できない
} as const;
