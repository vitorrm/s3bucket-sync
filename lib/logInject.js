const bunyan = require('bunyan')
const lodashGet = require('lodash/get')
const config = require('config')

const _ = {
	get: lodashGet
}

function Log (props) {
	const log = bunyan.createLogger({
		name: props.name,
		level: process.env.LOG_LEVEL || _.get(config, 'logLevel') || bunyan.INFO
	})

	this.log = log.child({
		apiRequestId: props.apiRequestId,
		awsRequestId: props.awsRequestId,
		source: props.name,
		sessionUuid: props.sessionUuid
	})
}

/**
 * @param  {Function} handler - the Lambda function handler which will receive a log instance
 * @return {Function} the handler invoked by the API Gateway integration
 */
module.exports = function logInit (handler) {
	return (event, context, callback) => {
		const logger = new Log({
			// NOTE: functions that aren't invoked directly from API Gateway
			// won't have a requestContext object
			// TODO: look at setting ClientContext when in invoking child Lambda
			// http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html#invoke-property
			apiRequestId: _.get(event, 'requestContext.requestId'),
			parentAwsRequestId: _.get(event, 'payload.parentAwsRequestId'),
			awsRequestId: _.get(context, 'awsRequestId'),
			sessionUuid: _.get(event, 'headers.session-uuid') || _.get(event, 'suuid'),
			name: _.get(context, 'functionName', 'unknown')
		})

		const { log } = logger
		log.info({ event, context }, '--> start request')
		handler(log, event, context, (e, response) => {
			log.info({ e, response }, '--> end request')
			return callback(e, response)
		})
	}
}
