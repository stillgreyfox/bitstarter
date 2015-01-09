#!/usr/bin/env nodejs

/*
Automatically grade files for the prescense of specified HTML tags/attributes.
Uses commander.js and cheerio.
Teaches CLI app dev and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowachuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.com/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var HTMLURL_DEFAULT = "./index.html";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        // http://nodejs.org/api/process.html#process_process_exit_code
        process.exit(1);
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var buildfn = function(checksfile) {
    /*
      not sure how this works, but it does error checking
      and if the API response is good, it'll post-process to console
    */
    var checkHtmlURL = function(result) {
        if (result instanceof Error) {
            console.log('Error:', result.message);
            this.retry(5000); // try again after 5 sec
        } else {
            $ = cheerio.load(result);
            var checks = loadChecks(checksfile).sort();
            var out = {};
            for(var ii in checks) {
                var present = $(checks[ii]).length > 0;
                out[checks[ii]] = present;
            }
            var outJson = JSON.stringify(out, null, 4);
            console.log(outJson);
        }
    };
    return checkHtmlURL;
};

var clone = function(fn) {
    // workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json',
                clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html',
                clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <html_url>', 'URL to index.html',
                null, HTMLURL_DEFAULT)
        .parse(process.argv);
    var checkJson;
    if(program.url) {
        var checkHtmlURL = buildfn(program.checks);
        rest.get(program.url).on("complete", checkHtmlURL);
    } else {
        checkJson = checkHtmlFile(program.file, program.checks);
        var outJson = JSON.stringify(checkJson, null, 4);
        console.log(outJson);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
