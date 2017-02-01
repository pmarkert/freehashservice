var aws = require('aws-sdk');
var crypto = require("crypto");
var Transform = require("stream").Transform;

var hasher = function() {
    var transformer = new Transform({ decodeStrings: false });
    var previousLine = null;
    var line_count = 0;
    var finished = false;
    transformer._transform = function (chunk, encoding, done) {
        if(!finished) {
	    if(previousLine) {
		chunk = previousLine + chunk;
	    }
	    var parts = chunk.split("\n");
	    previousLine = parts.splice(parts.length-1,1)[0];
	    parts.forEach(line => {
		this.push(crypto.createHash('sha256').update(line).digest('hex') + "\n");
		line_count++;
		if(line_count%10000===0) {
		    console.log(`${line_count} lines processed`);
		}
		if(line_count%1000000===0) {
		    finished = true;
		}
	    });
        }
        done();
    };
    
    transformer._flush = function(done) {
        if (!finished && previousLine) {
	    this.push(crypto.createHash('sha256').update(previousLine).digest('hex') + "\n");
	    line_count++;
	    previousLine = null
        }
        console.log(`${line_count} lines processed`);
        done()
    };
    return transformer;
}

function convert(bucket, fileKey, callback) {
    var s3 = new aws.S3();
    var read_request = {
	Bucket: bucket,
	Key: fileKey
    };
    console.log(`Downloading - ${JSON.stringify(read_request)}`);

    var stream = s3.getObject(read_request).createReadStream();
    stream.setEncoding('utf8');
    var transformer = hasher();
    stream.pipe(transformer);

    save_request = {
	Bucket: bucket,
	Key: fileKey.replace(/^upload/, "download") + ".hashed",
	ACL: 'public-read'
    };
    console.log("Uploading - " + JSON.stringify(save_request));
    save_request.Body = transformer;
    return s3.upload(save_request).promise();
};

exports.handler = function (event, context) {
    console.log("Processing event:\n", JSON.stringify(event, null, 2));
    var eventRecord = event.Records && event.Records[0];
    if (eventRecord) {
	if (eventRecord.eventSource === 'aws:s3' && eventRecord.s3) {
    convert(eventRecord.s3.bucket.name, eventRecord.s3.object.key)
	.then((result) => { context.done(null, result); })
	.catch((err) => { console.log("Error - " + err); context.done(err); })
	} else {
    context.fail('Unsupported event source');
	}
    } else {
	context.fail('No records in the event');
    }
};

