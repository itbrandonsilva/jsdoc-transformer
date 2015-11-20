"use strict";

var path = require('path');
var _ = require('lodash');

var argv = require('yargs')
    .array('transformers')
    .default('transformers', ['default.js'])
    .argv;

function loadTransformer(transformerPath) {
    var style;
    if (transformerPath) {
        try {
            if (/^[a-zA-Z\.]+$/.test(transformerPath || '')) {
                transformerPath = path.join(__dirname, '..', 'transformers', transformerPath);
                style = require(transformerPath);
            } else {
                style = require(transformerPath);
            }
        } catch (e) {
            console.error(e);
            throw new Error('Invalid style path: ' + transformerPath);
        }
    }

    if ( ! style ) {
        var defaultTransformerPath = path.join(__dirname, '..', 'transformers', 'default.js');
        style = require(defaultStylePath);
    }

    return style;
}

function commentToMd(comment, style) {
    var markdown = style.template;
    if (typeof markdown == 'function') return markdown(comment);
    if (typeof comment != 'object') return markdown.replace(/{{value}}/g, comment);
    if (Array.isArray(comment)) {
        let markdown = '';
        comment.forEach(function (element) {
            markdown += commentToMd(element, style);
        });
        return markdown;
    }

    if (comment.kind) {
        style = style[comment.kind];
        if ( ! style ) return '';
        markdown = style.template;
    }

    var keys = markdown.match(/{{[^}]+}}/g).map(function (key) { return key.replace(/{|}/g, ''); });
    keys.forEach(function (key) {
        var value = comment[key];
        if ( ! value ) return;
        if (typeof value == 'object') value = commentToMd(value, style[key]);
        markdown = markdown.replace(new RegExp('{{' + key + '}}', 'g'), value);
    });

    return markdown;
}

process.stdin.on('data', function (chunk) {
    var markdown = '';

    var jsdoc = JSON.parse(chunk.toString());

    var style = {};
    argv.transformers.forEach(function (transformerPath) {
        var transformer = loadTransformer(transformerPath);
        if (transformer.extend) jsdoc.forEach(function (comment) { transformer.extend(comment) });
        _.merge(style, transformer.style);
    });

    jsdoc.forEach(function (comment) {
        markdown += commentToMd(comment, style);
    });

    process.stdout.write(markdown);
});
