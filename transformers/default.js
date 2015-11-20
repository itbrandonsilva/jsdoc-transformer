"use strict";

var _ = require('lodash');

var style = {
    class: {
        template: '## {{name}} {{paramsSummary}}  \n{{description}}\n\n{{params}}',
        params: {
            template: '{{name}}: {{description}}  \n'
        },
        paramsSummary: {
            template: function (comment) {
                return '(' + comment.join(', ') + ')';
            }
        }
    }
};
style.function = style.class;

var extend = function (comment) {
    if (['function', 'class'].indexOf(comment.kind) == -1) return;
    comment.paramsSummary = comment.params.map(function (param) {
        return param.name + ':' + param.type.names[0];
    });
}

module.exports = {style, extend}
