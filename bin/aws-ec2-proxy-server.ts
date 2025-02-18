#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AwsEc2ProxyServerStack } from "../lib/aws-ec2-proxy-server-stack";
import { getConfig } from "../lib/config";

const config = getConfig();

const app = new cdk.App();

new AwsEc2ProxyServerStack(app, "AwsEc2ProxyServerStack", {
  env: {
    region: config.REGION,
    account: config.ACCOUNT,
  },
  config,
});
