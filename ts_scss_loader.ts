import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript'
import * as sass from 'node-sass';

interface SassOpts {
    includePaths: string[]
}

export function transformer(options?: SassOpts) {

    let opts = options;

    let visitor = function (ctx: ts.TransformationContext, sf: ts.SourceFile) {
        const visitor: ts.Visitor = function (node: ts.Node): ts.VisitResult<ts.Node> {
            if (ts.isCallExpression(node) && node.expression.getText(sf.getSourceFile()) == 'include_scss') {
                let file_name = node.arguments[0];
                if (ts.isStringLiteral(file_name)) {
                    let dir = path.dirname(sf.getSourceFile().fileName);
                    let str_file_name = file_name.getText(sf.getSourceFile());
                    str_file_name = str_file_name.substring(1, str_file_name.length - 1);
                    //let contents = fs.readFileSync(, "utf-8").trim();
                    let contents = sass.renderSync({
                        file: path.join(dir, str_file_name),
                        outputStyle: "compressed",
                        includePaths: opts ? opts.includePaths : []
                    }).css.toString('utf-8').trim();
                    return ts.createStringLiteral(contents);
                }
            }
            // here we can check each node and potentially return 
            // new nodes if we want to leave the node as is, and 
            // continue searching through child nodes:
            return ts.visitEachChild(node, visitor, ctx)
        }.bind(opts)
        return visitor
    }.bind(opts)

    return (ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
        return (sf: ts.SourceFile) => ts.visitNode(sf, visitor(ctx, sf))
    }
}