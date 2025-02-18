# AWS-Ec2-Proxy-Server

This is the CDK version of [CloudFormation-Templates/Ec2-Proxy-Server.yaml](https://github.com/SolidGoat/CloudFormation-Templates/blob/main/Ec2-Proxy-Server.yaml) written in TypeScript with some slight improvements.

Creates a small EC2 SOCKS5 and Tinyproxy server using an Ubuntu AMI.

It's assumed that you have AWS CDK for TypeScript installed, along with any other prerequisites.

If not, follow the instructions here:

https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html

## How to Deploy

1. Clone repository
   ```
   $ git clone https://github.com/SolidGoat/AWS-Ec2-Proxy-Server.git
   ```
2. Download and install dependencies
   ```
   $ npm build
   ```
3. Set your environment variables

   Configuration of certain variables are controlled through a `.env` file. If this file isn't set, default values are chosen in the [`config.ts`](lib/config.ts) file.

   Default values:

   ```
   IP="0.0.0.0/0"
   RELEASE="noble"
   INSTANCE_CLASS="t4g"
   INSTANCE_SIZE="nano"
   INSTANCE_ARCH="arm64"
   REGION="us-east-1"
   ACCOUNT=""
   ```

   1. To set these values:
      1. Make a copy of the `.env-example` file
      2. Rename it to `.env` (will not be tracked by git)
      3. Update the values

   \* NOTE: This is just a tiny proxy server, so `t4g.nano` should more than enough.

   If you do decide to change this, the stack will use the appropriate CPU architecture for the AMI if using a non-Graviton instance type (amd64 vs. arm64) [e.g. `t3.micro`]

4. Deploy the stack

   ```
   $ cdk deploy
   ```

   OR

   ```
   $ npx cdk deploy
   ```

5. The SSH private key is saved to AWS Systems Manager Parameter Store as a Secure String, using the following name: `/ec2/keypair/${keyPair.keyPairId}` (e.g. `/ec2/keypair/key-12345abc67890`)

   1. The full name will be displayed in the output when the stack has completed deployment
   2. There is also an AWS CLI command that I provided in the output to decrypt the value and store it in a .pem file

   ```
   aws ssm get-parameter --name "/ec2/keypair/key-12345abc67890" --with-decryption --query "Parameter.Value" --output text > ./privatekey.pem
   ```

6. Destroy the stack
   ```
   $ cdk destroy
   ```
   OR
   ```
   $ npx cdk destroy
   ```
