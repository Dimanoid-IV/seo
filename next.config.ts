import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/integrations/wordpress/plugin": ["./wordpress-plugin/rankboost-connector/**/*"],
  },
};

export default nextConfig;
