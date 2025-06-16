/** @type {import('next').NextConfig} */

const { attachReactRefresh } = require('next/dist/build/webpack-config');

const isProduction = process.env.NODE_ENV == "production";

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  pageExtensions: ["page.tsx", "api.ts"],
  // output: isProduction ? "wallet" : "",
  // assetPrefix: isProduction ? "/wallet" : "",
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: [{ loader: "@svgr/webpack", options: { icon: true } }],
    });
    return config;
  },
};

module.exports = nextConfig;
