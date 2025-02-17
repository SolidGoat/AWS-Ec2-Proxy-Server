#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AwsEc2ProxyServerV2Stack } from "../lib/aws-ec2-proxy-server-v2-stack";
import { getConfig } from "../lib/config";

const config = getConfig();

const app = new cdk.App();

new AwsEc2ProxyServerV2Stack(app, "AwsEc2ProxyServerV2Stack", {
  config,
});
