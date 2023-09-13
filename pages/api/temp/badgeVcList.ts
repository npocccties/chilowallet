import type { NextApiRequest, NextApiResponse } from "next";
import { BadgeInfo, IfBadgeInfo } from "../../../types/BadgeInfo";

type Data = {
  data: {
    image: string;
    name: string;
    category: string;
    issuer: string;
    issuedate: string;
  }[];
  totalPages: number;
  currentPage: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  console.log("server", req);
  const currentPage = Number(req.query.page) || 1;
  const limit = 5;
  const offset = (currentPage - 1) * limit;

  const paginatedItems = dummy.slice(offset, offset + limit);
  const totalPages = Math.ceil(dummy.length / limit);

  res.status(200).json({
    data: paginatedItems,
    totalPages,
    currentPage,
  });
}

const dummy = [
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理1",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "教育相談-学校生活における具体的な支援- (v1.0)",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "子どもの心に耳をすます‐感情の社会化を促す関わり (v1.0)",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理4",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理5",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理6",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理7",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理8",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理9",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理6",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理11",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理6",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理7",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理8",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理9",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理6",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理6",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理7",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理8",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理9",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理6",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理6",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理7",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理8",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理9",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理6",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理6",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理7",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理8",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理9",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理6",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理6",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理7",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理8",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理9",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理6",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理6",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理7",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理8",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理9",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理6",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理6",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理7",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理8",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理9",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理6",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理6",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理7",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理8",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理9",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理6",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理6",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理7",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理8",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理9",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理6",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理6",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理7",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理8",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理9",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理6",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理6",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理7",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理8",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理9",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
  {
    image: "https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png",
    name: "学校安全と危機管理6",
    category: "教員としての基本的資質",
    issuer: "○○大学",
    issuedate: "2023/09/05",
  },
];
