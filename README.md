# CloudFinalProject
A cloud-based event management system built with AWS CDK, React, and Node.js. This application allows users to create an account, and create/view events. Other users can view these events, and sign-up for them.

## AWS Services Used
- CDK
- Lambda
- S3
- Cognito
- API Gateway
- CloudFront

## Github Repositories
- The completed GitHub repository with all of the correct code for the project is at https://github.com/jackfallon/CloudFinalProject
- The first GitHub repository that was used, but contains incorrect, outdated code for the project is at https://github.com/jackfallon/EventManager

## Project Structure

- `/frontend` - React frontend application
- `/backend` - Node.js Lambda functions
- `/lib` - CDK infrastructure code

## Useful commands

* `npx cdk deploy`       deploy this stack to your default AWS account/region
* `npx cdk diff`         compare deployed stack with current state
* `npx cdk synth`        emits the synthesized CloudFormation template

## Deployment Instructions
1. In the root project directory, run 'cdk deploy' to deploy the CDK infrastructure
2. When the CDK is deployed, values such as UserPoolID, UserPoolClientID, etc. will be printed
3. Enter these values in the frontend directory's .env and .env.development files
4. Run 'cd frontend' and 'npm install' and then 'npm run build' to build the React frontend
5. Run 'cd ..' and deploy the application again with 'cdk deploy'
