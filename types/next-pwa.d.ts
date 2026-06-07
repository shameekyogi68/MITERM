declare module "next-pwa" {
  import { NextConfig } from "next";
  export default function withPWA(pwaConfig: any): (nextConfig: NextConfig) => NextConfig;
}
