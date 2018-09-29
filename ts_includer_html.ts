import * as path from 'path';
import * as fs from 'fs';
import * as ts from 'typescript';
import * as dm from 'xmldom';
//import minify from 'html-minifier';
var minify = require('html-minifier').minify;

let error_handler: dm.ErrorHandlerObject = {
    warning: (msg: any) => { },
    error: (msg: any) => { /*console.log(msg)*/ },
    fatalError: (msg: any) => { console.log(msg) }
}

export function transformer(/*opts?: Opts*/) {
    function visitor(ctx: ts.TransformationContext, sf: ts.SourceFile) {
        const visitor: ts.Visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
            if (ts.isCallExpression(node) && node.expression.getText(sf.getSourceFile()) == 'include_html') {
                let file_name = node.arguments[0];
                if (ts.isStringLiteral(file_name)) {
                    let dir = path.dirname(sf.getSourceFile().fileName);
                    let str_file_name = file_name.getText(sf.getSourceFile());
                    str_file_name = str_file_name.substring(1, str_file_name.length - 1);
                    let content = fs.readFileSync(path.join(dir, str_file_name), "utf-8").trim();
                    let parser = new dm.DOMParser({ errorHandler: error_handler });
                    let serializer = new dm.XMLSerializer();
                    let parsed = parser.parseFromString(content, "text/html");
                    let minified = minify(serializer.serializeToString(parsed), {
                        removeAttributeQuotes: true,
                        collapseWhitespace: true,
                        removeComments: true
                    });
                    return ts.createStringLiteral(minified.trim());
                }
            }
            // here we can check each node and potentially return 
            // new nodes if we want to leave the node as is, and 
            // continue searching through child nodes:
            return ts.visitEachChild(node, visitor, ctx)
        }
        return visitor
    }
    return (ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
        return (sf: ts.SourceFile) => ts.visitNode(sf, visitor(ctx, sf))
    }
}