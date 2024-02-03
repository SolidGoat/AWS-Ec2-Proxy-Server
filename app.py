#!/usr/bin/env python3
import os

import aws_cdk as cdk

from aws_ec2_proxy_server.aws_ec2_proxy_server_stack import AwsEc2ProxyServerStack

app = cdk.App()
AwsEc2ProxyServerStack(app, "AwsEc2ProxyServerStack",
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region=os.getenv('CDK_DEFAULT_REGION')
    ),

    # Changeable values
    ipv4='0.0.0.0/0', # Allowed incoming public IP (in CIDR notation)
    ec2_instance_type='t4g.nano'
)

app.synth()
