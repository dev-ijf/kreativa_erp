import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** PDFKit membaca font standar dari `js/data/*.afm` via `__dirname`; bundling merusak path (ERR_EMPTY_RESPONSE / ENOENT). */
  serverExternalPackages: ["pdfkit"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
