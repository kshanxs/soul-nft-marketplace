/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: "",
  transpilePackages: ["@base-org/account", "thirdweb"],
};

module.exports = nextConfig;
