import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { ConfigProps } from "./config";
import { readFileSync } from "fs";

type AwsEc2ProxyServerV2StackProps = cdk.StackProps & {
  config: Readonly<ConfigProps>;
};

export class AwsEc2ProxyServerV2Stack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: AwsEc2ProxyServerV2StackProps
  ) {
    super(scope, id, props);

    const { config } = props;

    // ****VPC****
    const vpc = ec2.Vpc.fromLookup(this, "Vpc", { isDefault: false });
    // ****VPC End****

    // ****Key Pair****
    const keyPair = new ec2.KeyPair(this, "ProxyServer-KeyPair", {
      type: ec2.KeyPairType.ED25519,
      format: ec2.KeyPairFormat.PEM,
    });
    // ****Key Pair End****

    // ****Security Group****
    const securityGroup = new ec2.SecurityGroup(
      this,
      "ProxyServer-SecurityGroup",
      {
        vpc: vpc,
        description: "Allow SSH and TCP/8888 access to EC2 proxy server",
        allowAllOutbound: true,
        allowAllIpv6Outbound: true,
      }
    );

    securityGroup.addIngressRule(
      ec2.Peer.ipv4(config.IP),
      ec2.Port.SSH,
      "Allow SSH"
    );

    securityGroup.addIngressRule(
      ec2.Peer.ipv4(config.IP),
      ec2.Port.tcp(8888),
      "Allow Tinyproxy on TCP/8888"
    );
    // ****Security Group End****

    // ****Ec2 Instance****
    const ami = ec2.MachineImage.fromSsmParameter(
      `/aws/service/canonical/ubuntu/server/${config.RELEASE}/stable/current/${config.INSTANCE_ARCH}/hvm/ebs-gp3/ami-id`
    );

    const ec2InstanceType = new ec2.InstanceType(
      `${config.INSTANCE_CLASS}.${config.INSTANCE_SIZE}`
    );

    const ec2Instance = new ec2.Instance(this, "ProxyServer-Instance", {
      vpc: vpc,
      instanceType: ec2InstanceType,
      machineImage: ami,
      associatePublicIpAddress: true,
      keyPair: keyPair,
      securityGroup: securityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    // Read user-data.sh script
    // Replace ${INGRESS_IP} with IP from .env file
    const userDataScript = readFileSync(
      "./lib/scripts/user-data.sh",
      "utf-8"
    ).replace("${INGRESS_IP}", config.IP);

    ec2Instance.addUserData(userDataScript);
    // ****Ec2 Instance End****

    // ****Output****
    new cdk.CfnOutput(this, "Ec2PublicDNS", {
      value: ec2Instance.instancePublicDnsName,
      description: "Public DNS of EC2 instance",
    });

    new cdk.CfnOutput(this, "Ec2PublicIP", {
      value: ec2Instance.instancePublicIp,
      description: "Public IP address of EC2 instance",
    });

    new cdk.CfnOutput(this, "Socks5Command", {
      value: `ssh -i private.pem -D 8081 ubuntu@${ec2Instance.instancePublicIp}`,
      description: "SSH dynamic port forward for SOCKS5 proxy",
    });

    new cdk.CfnOutput(this, "SsmPrivateKeyCommand", {
      value: `aws ssm get-parameter --name "/ec2/keypair/${keyPair.keyPairId}" --with-decryption`,
      description: "SSM command to get private key from Parameter Store",
    });

    // ****Output End****
  }
}
