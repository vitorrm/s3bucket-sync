# Overview
This projects has an example of a lambda that replicates the content from one S3 bucket (source) to S3 another (destination) in a different account

You can use this example to configure your own application

# Deploy
```sh

npm install

# Deploying the sync function
sls deploy --stage <stage> --aws-profile <sourceAccount>

# Getting the deployed function's role's ARN (syncLambdaRoleArn)
aws cloudformation describe-stacks --stack-name s3bucket-sync-<stage> --query 'Stacks[0].Outputs[?OutputKey==`SyncBucketsRoleArn`].OutputValue' --output text --profile <sourceAccount>

# Adding cross role policy permissions in destination bucket
# **Important** The policy in the destination bucket will be replaced with this command. Do it manually if you already have a policy you wanna keep
AWS_PROFILE=<destinationAccount> NODE_ENV=<stage> node node configDestBucket.js --lambda-role-arn <syncLambdaRoleArn>

# Getting the deployed function's ARN (syncLambdaArn)
aws cloudformation describe-stacks --stack-name s3bucket-sync-<stage> --query 'Stacks[0].Outputs[?OutputKey==`SyncBucketsLambdaArn`].OutputValue' --output text --profile <sourceAccount>

# Adding Lambda notification configuration
AWS_PROFILE=<sourceAccount> NODE_ENV=<stage> node node configSrcBucket.js --lambda-arn <syncLambdaArn>


```


