import { LmsList } from "@prisma/client";

export type LmsListResponse = {
  lmsList: LmsList[];
  loginError?: string;
};
