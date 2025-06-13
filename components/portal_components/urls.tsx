export const logoTitle      = process.env.NEXT_PUBLIC_PORTAL_HEADER_LOGO_TITLE as string;
export const logoLink       = process.env.NEXT_PUBLIC_PORTAL_HEADER_LOGO_LINK as string;
export const dashboardTitle = process.env.NEXT_PUBLIC_PORTAL_HEADER_DASHBOARD_TITLE as string;
export const dashboardLink  = process.env.NEXT_PUBLIC_PORTAL_HEADER_DASHBOARD_LINK as string;
export const learningTitle  = process.env.NEXT_PUBLIC_PORTAL_HEADER_LEARNING_TITLE as string;
export const learningLink   = process.env.NEXT_PUBLIC_PORTAL_HEADER_LEARNING_LINK as string;
export const issuerTitle    = process.env.NEXT_PUBLIC_PORTAL_HEADER_ISSUER_TITLE as string;
export const issuerName     = process.env.NEXT_PUBLIC_PORTAL_HEADER_ISSUER_NAME as string;
export const issuerLink     = process.env.NEXT_PUBLIC_PORTAL_HEADER_ISSUER_LINK as string;
export const footerName     = process.env.NEXT_PUBLIC_PORTAL_FOOTER_NAME as string;
export const footerLink     = process.env.NEXT_PUBLIC_PORTAL_FOOTER_LINK as string;

export type urlInfo = {
    name: string;
    url: string;
}

export type urlInfos = urlInfo[]

// ",区切りで、名前とURLが指定されているとする。"
function parseUrls(name: string, url:string): urlInfos {
    const nameList = (name ?? "").split(",").map(str => str.trim());
    const urlList = (url ?? "").split(",").map(str => str.trim());
    if (nameList.length !== urlList.length) {
        return []
    }
    const issuers: urlInfos = nameList.map((name, index) => ({
        name,
        url: urlList[index],
    }));
    return issuers;
}

export const issuerInfos = parseUrls(issuerName, issuerLink)
export const footerInfos = parseUrls(footerName, footerLink)