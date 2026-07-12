/** @type {import('next').NextConfig} */
const nextConfig = {
  // @libsql/client is a native/server-only dep; keep it external to the bundle.
  serverExternalPackages: ["@libsql/client", "libsql"],
};

export default nextConfig;
