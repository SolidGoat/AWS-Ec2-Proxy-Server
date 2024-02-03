from aws_cdk import (
    aws_ec2 as ec2,
    CfnOutput,
    Stack
)
from constructs import Construct
import re

class AwsEc2ProxyServerStack(Stack):

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        ipv4: str,
        ec2_instance_type: str,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Get VPC
        vpc = ec2.Vpc.from_lookup(self, 'Vpc', is_default=False)

        # Create keypair for EC2
        key_pair = ec2.KeyPair(self, 'KeyPair',
            key_pair_name='ec2-proxy-key',
            type=ec2.KeyPairType.ED25519,
            format=ec2.KeyPairFormat.PEM
        )

        # Create Security Group
        proxy_security_group = ec2.SecurityGroup(self, 'ProxyServerSecurityGroup',
            vpc=vpc,
            description="Allow SSH and TCP/8888 access to EC2 proxy server",
            allow_all_outbound=True,
            allow_all_ipv6_outbound=True
        )

        proxy_security_group.add_ingress_rule(
            ec2.Peer.ipv4(ipv4),
            ec2.Port.tcp(22),
            description='Allow SSH'
        )

        proxy_security_group.add_ingress_rule(
            ec2.Peer.ipv4(ipv4),
            ec2.Port.tcp(8888),
            description='Allow Tinyproxy on TCP/8888'
        )
        
        # EC2 Ubuntu AMI
        # Determine if instance type is Graviton
        if re.search(r'\d{1}g'.lower(), ec2_instance_type):
            ubuntu_arm64_ami = ec2.MachineImage.from_ssm_parameter(
                '/aws/service/canonical/ubuntu/server/jammy/stable/current/arm64/hvm/ebs-gp2/ami-id'
            )
        else:
            ubuntu_arm64_ami = ec2.MachineImage.from_ssm_parameter(
                '/aws/service/canonical/ubuntu/server/jammy/stable/current/amd64/hvm/ebs-gp2/ami-id'
            )

        # Create EC2 instance
        ec2_instance = ec2.Instance(self, 'EC2Instance',
            instance_type=ec2.InstanceType(f'{ec2_instance_type}'),
            machine_image=ubuntu_arm64_ami,
            block_devices=[
                ec2.BlockDevice(
                    device_name='/dev/sda1',
                    volume=ec2.BlockDeviceVolume.ebs(
                        volume_size=8,
                        delete_on_termination=True,
                        volume_type=ec2.EbsDeviceVolumeType.GP3
                    )
                )
            ],
            vpc=vpc,
            associate_public_ip_address=True,
            key_pair=key_pair,
            security_group=proxy_security_group,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC)
        )

        # Add user-data.sh script and replace variables
        with open('lib/scripts/user-data.sh', 'r') as f:
            ec2_instance.add_user_data(f.read().replace('${INGRESS_IP}', ipv4))
        
        # Cfn output
        cfn_output = [
            {
                'id': 'EC2_Instance_ID',
                'value': ec2_instance.instance_id,
                'description': 'InstanceId of EC2 instance'
            },
            {
                'id': 'EC2_AZ',
                'value': ec2_instance.instance_availability_zone,
                'description': 'Availability Zone of EC2 instance'
            },
            {
                'id': 'EC2_Public_DNS',
                'value': ec2_instance.instance_public_dns_name,
                'description': 'Public DNS of EC2 instance'
            },
            {
                'id': 'EC2_Public_IP',
                'value': ec2_instance.instance_public_ip,
                'description': 'Public IP address of EC2 instance'
            },
            {
                'id': 'SOCKS5_Command',
                'value': f'ssh -i {key_pair.key_pair_name}.pem -D 8081 ubuntu@{ec2_instance.instance_public_ip}',
                'description': 'SSH dynamic port forward for SOCKS5 proxy'
            },
            {
                'id': 'SSM_Private_Key_Location',
                'value': f'/ec2/keypair/{key_pair.key_pair_id}',
                'description': 'SSM location of private key'
            }
        ]

        for output in cfn_output:
            CfnOutput(self, output['id'], value=output['value'], description=output['description'])