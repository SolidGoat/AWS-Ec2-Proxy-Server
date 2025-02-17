import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export type ConfigProps = {
  IP: string;
  RELEASE: string;
  INSTANCE_CLASS: string;
  INSTANCE_SIZE: string;
  INSTANCE_ARCH: string;
  REGION: string;
  ACCOUNT: string;
};

export const getConfig = (): ConfigProps => ({
  IP: process.env.IP || "0.0.0.0/0",
  RELEASE: (process.env.RELEASE || "noble").toLowerCase(),
  INSTANCE_CLASS: process.env.INSTANCE_CLASS || "t4g",
  INSTANCE_SIZE: process.env.INSTANCE_SIZE || "nano",
  INSTANCE_ARCH: (process.env.INSTANCE_CLASS || "t4g").endsWith("g")
    ? "arm64"
    : "amd64",
  REGION: process.env.REGION || "us-east-1",
  ACCOUNT: process.env.ACCOUNT || "",
});
