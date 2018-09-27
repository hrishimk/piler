import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import * as sass from 'node-sass';
var watch = require('node-watch');
var mkdirp = require('mkdirp');

var exts = ["ts", "css", "scss"];

var main_out_dir = "../html";

let TsConfig: {
    options: ts.CompilerOptions;
    errors: ts.Diagnostic[];
};

function read_dir(dir?: string) {
    dir = dir ? dir : './src';
    fs.readdir(dir, function (err, files) {
        if (err) throw err;

        for (let file of files) {
            let file_path = path.join(dir, file);
            handle_file(file_path);
        }

    }.bind(dir));
}

function handle_file(file) {
    let params = { file: file };
    fs.stat(file, function (err, stats) {
        if (err) throw err;

        let file = params.file;

        if (stats.isDirectory()) {
            read_dir(file);
            return;
        }
        let file_ext = path.extname(file);
        if (exts.indexOf(file_ext.substring(1)) === -1) {
            return;
        }
        let out_dir = get_full_out_dir(file);
        fetch(out_dir, file, function () {
            //console.log(file + ' piled\n');
        }.bind(file));

    }.bind(params));
}

function fetch(out_dir: string, full_file_name: string, cb: Function) {
    let params = {
        out_dir: out_dir,
        full_file_name: full_file_name,
        cb: cb
    };
    fs.readFile(full_file_name, { encoding: 'utf-8' }, function (err, content) {
        if (err) throw err;
        transpile(params.out_dir, params.full_file_name, content, params.cb);
    }.bind(params));
}

function save(out_dir: string, full_file_name: string, content: string | Buffer, cb) {
    let file_name = path.join(out_dir, path.basename(full_file_name));
    let file_path = path.dirname(file_name);
    let params = {
        file_name: file_name,
        content: content,
        cb: cb
    };
    mkdirp(file_path, function (err) {
        if (err) console.error(err)
        fs.writeFile(params.file_name, params.content, { encoding: "utf-8", flag: 'w+' }, function (err) {
            if (err) throw err;
            params.cb();
        });
    }.bind(params));
}

function transpile(out_dir: string, full_file_name: string, content: string, cb: Function) {
    switch (path.extname(full_file_name)) {
        case '.ts':
            ts_transpile(out_dir, full_file_name, content, cb);
            break;
        case '.scss':
            let not_compile = path.basename(full_file_name).substring(0, 1) === '_';
            if (not_compile) {
                return;
            }
            sass_transpile(out_dir, full_file_name, content, cb);
            break;
    }
}

function get_full_out_dir(full_file_name: string): string {
    let no_src = full_file_name.substring(3);
    return path.join(main_out_dir, path.dirname(no_src));
}

function ts_transpile(out_dir: string, full_file_name: string, content: string, cb: Function) {
    let changed_name = full_file_name.substring(0, full_file_name.length - 2) + 'js';
    let file_name = path.basename(full_file_name);
    let output = ts.transpileModule(content, { compilerOptions: TsConfig.options, fileName: full_file_name });
    save(out_dir, changed_name, output.outputText, cb);
    if (output.sourceMapText) {
        save(out_dir, changed_name + '.map', output.sourceMapText, cb);
    }
}

function sass_transpile(out_dir: string, full_file_name: string, content: string, cb: Function) {
    full_file_name = full_file_name.substring(0, full_file_name.length - 4) + 'css';
    let base_path = path.dirname(full_file_name);
    let params = {
        out_dir: out_dir,
        full_file_name: full_file_name,
        cb: cb
    };
    sass.render({
        data: content,
        includePaths: [base_path],
        outFile: out_dir
    }, function (err, result) {
        if (err) throw err;
        save(params.out_dir, params.full_file_name, result.css, params.cb);
    }.bind(params));
}

let ts_json = fs.readFileSync('./src/tsconfig.json', 'utf-8');
let ts_json_config = ts.parseConfigFileTextToJson('./tsconfig.json', ts_json);
ts_json_config.config.compilerOptions.outDir = main_out_dir;
TsConfig = {
    options: ts_json_config.config.compilerOptions,
    errors: []
}

//console.log(TsConfig);
//read_dir();

watch('./src/', { persistent: true, recursive: true, encoding: 'utf-8' }, function (event, file_name) {
    if (event !== 'update') {
        return;
    }
    let base_name = path.basename(file_name);
    let ext_name = path.extname(file_name);
    if (base_name.substring(0, 1) === '_' && ext_name === '.scss') {
        read_dir('./src/css');
        return;
    }
    handle_file(file_name);
});
