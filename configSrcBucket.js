const aws = require('aws-sdk')

const config = require('config')

const s3 = new aws.S3({ apiVersion: '2006-03-01' })

const argv = require('minimist')(process.argv.slice(2)) // eslint-disable-line import/no-extraneous-dependencies

async function main () {
	if (!argv['lambda-arn']) {
		throw new Error('Missing parameters lambda-arn')
	}

	const srcBucketName = config.SrcBucket
	const lambdaArn = argv['lambda-arn']

	await updateNotificationConfiguration({
		srcBucketName,
		lambdaArn
	})
}

async function updateNotificationConfiguration ({ srcBucketName, lambdaArn }) {
	await addPermissionToInvokeLambda({
		srcBucketName,
		lambdaArn
	})
	const randomPostFix = Math.floor(Math.random() * 10000)
	const params = {
		Bucket: srcBucketName,
		NotificationConfiguration: {
			LambdaFunctionConfigurations: [
				{
					Id: `ReplicateBucket_${randomPostFix}`,
					LambdaFunctionArn: lambdaArn,
					Events: [
						's3:ObjectCreated:*',
						's3:ObjectRemoved:*'
					]
				}
			]
		}
	}

	await s3.putBucketNotificationConfiguration(params).promise()
}

async function addPermissionToInvokeLambda ({ srcBucketName, lambdaArn }) {
	const randomPostFix = Math.floor(Math.random() * 10000)
	const params = {
		Action: 'lambda:InvokeFunction',
		FunctionName: lambdaArn,
		Principal: 's3.amazonaws.com',
		SourceArn: `arn:aws:s3:::${srcBucketName}/*`,
		StatementId: `ID-S3Invoke-${randomPostFix}`
	}

	const lambda = new aws.Lambda({ region: config.SrcAwsRegion })
	await lambda.addPermission(params).promise()
}

main()
