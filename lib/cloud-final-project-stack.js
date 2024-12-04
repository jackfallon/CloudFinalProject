const { Stack, Duration, RemovalPolicy, CfnOutput } = require('aws-cdk-lib');
const cognito = require('aws-cdk-lib/aws-cognito');
const rds = require('aws-cdk-lib/aws-rds');
const ec2 = require('aws-cdk-lib/aws-ec2');
const s3 = require('aws-cdk-lib/aws-s3');
const s3deploy = require('aws-cdk-lib/aws-s3-deployment');
const lambda = require('aws-cdk-lib/aws-lambda');
const apigateway = require('aws-cdk-lib/aws-apigateway');
const cloudfront = require('aws-cdk-lib/aws-cloudfront');
const origins = require('aws-cdk-lib/aws-cloudfront-origins');
const iam = require('aws-cdk-lib/aws-iam');

class CloudFinalProjectStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // VPC for RDS
    const vpc = new ec2.Vpc(this, 'EventsAppVPC', {
      maxAzs: 2
    });

    // Security group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DBSecurityGroup', {
      vpc,
      description: 'Security group for RDS instance',
      allowAllOutbound: true
    });

    dbSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(3306),
      'Allow MySQL access'
    );

    // RDS Instance
    const database = new rds.DatabaseInstance(this, 'EventsDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0
      }),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC
      },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
      securityGroups: [dbSecurityGroup],
      databaseName: 'eventsdb',
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: 'events-db-credentials'
      }),
      removalPolicy: RemovalPolicy.DESTROY,
      deletionProtection: false
    });

    // CloudFront OAI
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'WebsiteOAI');

    // S3 bucket for frontend hosting
    const websiteBucket = new s3.Bucket(this, 'EventsWebsiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // Grant read access to CloudFront
    websiteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [websiteBucket.arnForObjects('*')],
        principals: [new iam.CanonicalUserPrincipal(originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
      })
    );

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'EventsDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket, {
          originAccessIdentity: originAccessIdentity
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.minutes(0)
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.minutes(0)
        }
      ]
    });

    // Deploy frontend to S3
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('frontend/build')],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*']
    });

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'EventsUserPool', {
      selfSignUpEnabled: true,
      autoVerify: { email: true },
      signInAliases: {
        email: true
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true
        }
      }
    });

    // Cognito User Pool Client
    const userPoolClient = new cognito.UserPoolClient(this, 'EventsUserPoolClient', {
      userPool,
      generateSecret: false,
      oAuth: {
        flows: {
          implicitCodeGrant: true
        },
        callbackUrls: [
          'http://localhost:3000',
          `https://${distribution.distributionDomainName}`
        ]
      }
    });

    // Lambda function for backend
    const backendFunction = new lambda.Function(this, 'EventsBackendFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('backend', {
        bundling: {
          image: lambda.Runtime.NODEJS_18_X.bundlingImage,
          local: {
            tryBundle(outputDir) {
              try {
                require('child_process').execSync(`cd backend && npm install && cp -r * ${outputDir}/`);
                return true;
              } catch (error) {
                return false;
              }
            }
          }
        }
      }),
      environment: {
        DATABASE_HOST: database.instanceEndpoint.hostname,
        DATABASE_NAME: 'eventsdb',
        DATABASE_SECRET_ARN: database.secret?.secretArn || '',
        USER_POOL_ID: userPool.userPoolId,
        CLIENT_ID: userPoolClient.userPoolClientId
      },
      timeout: Duration.seconds(30)
    });

    // Grant the Lambda function access to the database secret
    if (database.secret) {
      database.secret.grantRead(backendFunction);
    }

    // Grant the Lambda function access to RDS
    database.grantConnect(backendFunction);

    // API Gateway
    const api = new apigateway.RestApi(this, 'EventsApi', {
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
        allowMethods: ['*'],
        allowHeaders: ['*']
      }
    });

    const eventsResource = api.root.addResource('events');

    // GET all events
    eventsResource.addMethod('GET', new apigateway.LambdaIntegration(backendFunction));

    // POST new event
    eventsResource.addMethod('POST', new apigateway.LambdaIntegration(backendFunction));

    // GET specific event
    const eventResource = eventsResource.addResource('{id}');
    eventResource.addMethod('GET', new apigateway.LambdaIntegration(backendFunction));

    // GET event participants
    const participantsResource = eventResource.addResource('participants');
    participantsResource.addMethod('GET', new apigateway.LambdaIntegration(backendFunction));

    // Event signup
    const signupResource = eventsResource.addResource('signup');
    signupResource.addMethod('POST', new apigateway.LambdaIntegration(backendFunction));

    // Output important values
    new CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });
    new CfnOutput(this, 'ApiUrl', { value: api.url });
    new CfnOutput(this, 'CloudFrontUrl', { value: `https://${distribution.distributionDomainName}` });
  }
}

module.exports = { CloudFinalProjectStack }