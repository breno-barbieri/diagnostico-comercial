/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // Permite abrir o modo de desenvolvimento por um túnel público (microteaching online).
  allowedDevOrigins: ["*.trycloudflare.com"],
};
export default nextConfig;
