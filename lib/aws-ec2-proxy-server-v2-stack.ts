import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { ConfigProps } from "./config";

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

    const keyPair = new ec2.KeyPair(this, "ProxyServer-KeyPair", {
      type: ec2.KeyPairType.ED25519,
      format: ec2.KeyPairFormat.PEM,
    });

    // ****End of VPC****

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
      ec2.Peer.ipv4("0.0.0.0/0"),
      ec2.Port.tcp(8888),
      "Allow Tinyproxy on TCP/8888"
    );

    // ****End of Security Group****

    // ****Ec2 Instance****
    const ami = ec2.MachineImage.fromSsmParameter(
      `/aws/service/canonical/ubuntu/server/${config.RELEASE}/stable/current/amd64/hvm/ebs-gp3/ami-id`
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

    ec2Instance.addUserData("./lib/scripts/user-data.sh");

    // ****End of Ec2 Instance****

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
      value: `ssh -i ${keyPair.keyPairName}.pem -D 8081 ubuntu@${ec2Instance.instancePublicIp}`,
      description: "SSH dynamic port forward for SOCKS5 proxy",
    });

    new cdk.CfnOutput(this, "SsmPrivateKeyLocation", {
      value: `/ec2/keypair/${keyPair.keyPairId}`,
      description: "SSM location of private key",
    });

    // ****End of Output****
  }
}
