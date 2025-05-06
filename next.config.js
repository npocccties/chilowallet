/** @type {import('next').NextConfig} */

const { attachReactRefresh } = require('next/dist/build/webpack-config');

const isProduction = process.env.NODE_ENV == "production";

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  pageExtensions: ["page.tsx", "api.ts"],
  // output: isProduction ? "wallet" : "",
  // assetPrefix: isProduction ? "/wallet" : "",
};

module.exports = nextConfig;
