import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 상위 디렉터리의 lockfile 때문에 워크스페이스 루트가 잘못 추론되는 것을 막습니다.
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;
