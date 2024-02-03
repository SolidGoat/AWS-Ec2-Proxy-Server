
#  AWS-Ec2-Proxy-Server

This is the CDK version of [CloudFormation-Templates/Ec2-Proxy-Server.yaml](https://github.com/SolidGoat/CloudFormation-Templates/blob/main/Ec2-Proxy-Server.yaml).

Creates a small EC2 SOCKS5 and Tinyproxy server using the latest Ubuntu Jammy (22.04.3 LTS) AMI.

It's assumed that you have the AWS CDK installed, along with any othe prerequisites.

If not, follow the instructions here:

https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html

## How to Deploy
1. Clone repository
    ```
    $ git clone https://github.com/SolidGoat/AWS-Ec2-Proxy-Server.git
    ```
2. Activate the Python virtual environment
   1. Linux
        ```
        $ cd ./AWS-Ec2-Proxy-Server
        $ source .venv/bin/activate
        ```
    2. Windows
        ```
        % cd .\AWS-Ec2-Proxy-Server
        % .venv\Scripts\activate.bat
        ```
3. Install dependencies
    ```
    $ pip install -r requirements.txt
    ```
4. Set your environment variables
   
   If you don't need to do this, comment out lines 11 - 14 in `app.py`

   1. Linux
        ```
        export CDK_DEFAULT_ACCOUNT=123456789012
        export CDK_DEFAULT_REGION=us-east-1
        ```
   2. Windows
        ```
        set CDK_DEFAULT_ACCOUNT=123456789012
        set CDK_DEFAULT_REGION=us-east-1
        ```
5. In `app.py`, update lines 17 and 18 with the the public IP you want to allow to connect to the instance (use CIDR notation), and the EC2 instance type
   1. Leave `0.0.0.0/0` to allow any incoming IP
        ```
        ipv4='0.0.0.0/0',
        ec2_instance_type='t4g.nano'
        ```
    2. This is just a tiny proxy server, so `t4g.nano` should more than enough
       1. If you do decide to change this, the script will use the appropriate CPU architecture for the AMI if using a non-Graviton instance type (amd64 vs. arm64)
          1. e.g. `t3.micro`
6. Synthesize the CloudFormation template
    ```
    $ cdk synth
    ```
7. Deploy the CloudFormation template
    ```
    $ cdk deploy
    ```
8. The SSH private key is saved to AWS Systems Manager Parameter Store, using a parameter with the following name: `/ec2/keypair/{key_pair_id}`
   1. This will be displayed in the Output of the CloudFormation Stack.