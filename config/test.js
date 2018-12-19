module.exports = config()
module.exports.config = config

function config () {
	return {
		LogLevel: 'info',
		SrcAwsRegion: 'us-east-1',
		SrcBucket: '<SourceBucketName>',
		DestBucket: '<DestBucketName>'
	}
}
