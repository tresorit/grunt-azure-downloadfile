'use strict';

module.exports = function (grunt) {
    var azure = require('azure'),
        fs = require('fs');

    grunt.registerMultiTask('azure-downloadfile', 'Download a file from Azure storage blob', function () {
        var options = this.options({
            serviceOptions: [], // custom arguments to azure.createBlobService
            containerName: '',
            fileName: '',
            etag: true,
            timestamp: true
        });

        if (!options.containerName || !options.fileName) {
            grunt.fatal("containerName and fileName is required");
        }

        var blobService = azure.createBlobService.apply(azure, options.serviceOptions),
            done = this.async();

        blobService.getBlob(options.containerName, options.fileName, function(error, serverBlob) {
            if (!error){
                var tmp = options.fileName.split('.');
                var ext = (tmp.length > 1) ? tmp.pop() : '';
                var filename = tmp.join('.');

                // Add timestamp if required
                if (options.timestamp) {
                    var date = new Date();
                    var ts = String(Math.round(date.getTime() / 1000));
                    filename += '_' + ts;
                }

                // Add etag if required
                if (options.etag) {
                    filename += '_' + serverBlob.etag.replace(/"/g, '');
                }

                // Add extension
                if (ext) {
                    filename += '.' + ext;
                }

                // Add dest dir
                if (options.dest) {
                    filename = options.dest + filename;
                }
                var secondOptions = { accessConditions: { 'if-match': serverBlob.etag } };
                blobService.getBlob(options.containerName, options.fileName, secondOptions).pipe(fs.createWriteStream(filename)).on('finish', function () {
                    grunt.log.debug('Downloaded: ' + filename);
                    done();
                });
            } else {
                grunt.log.error(error);
                done(false);
            }
        });
    });
};
