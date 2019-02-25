"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var child_process_1 = require("child_process");
var constant_1 = require("../constant");
// cover cb type async function to promise
function pcb(cb, codes, isThrowError) {
    if (codes === void 0) { codes = []; }
    if (isThrowError === void 0) { isThrowError = true; }
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return new Promise(function (resolve, reject) {
            cb.apply(void 0, args.concat([function (error) {
                    var args = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        args[_i - 1] = arguments[_i];
                    }
                    if (error) {
                        if (isThrowError && (!codes || codes.indexOf(error.code) === -1)) {
                            return reject(error);
                        }
                    }
                    resolve(args.length < 2 ? args[0] : args);
                }]));
        });
    };
}
exports.pcb = pcb;
// get git hunk info
function gitDiff(params) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    var bufferInfo, fromFile, toFile, indexFile, diff, error_1;
                    return tslib_1.__generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                bufferInfo = params.bufferInfo, fromFile = params.fromFile, toFile = params.toFile;
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 6, , 7]);
                                return [4 /*yield*/, pcb(child_process_1.execFile)('git', ['--no-pager', 'show', ":" + bufferInfo.filePath], {
                                        cwd: bufferInfo.gitDir,
                                    })
                                    // write index file to tmp file
                                ];
                            case 2:
                                indexFile = (_a.sent())[0];
                                // write index file to tmp file
                                return [4 /*yield*/, pcb(fromFile.end.bind(fromFile))(indexFile)
                                    // write buffer content to tmp file
                                ];
                            case 3:
                                // write index file to tmp file
                                _a.sent();
                                // write buffer content to tmp file
                                return [4 /*yield*/, pcb(toFile.end.bind(toFile))(bufferInfo.content)
                                    // git diff exit with code 1 if there is difference
                                ];
                            case 4:
                                // write buffer content to tmp file
                                _a.sent();
                                return [4 /*yield*/, pcb(child_process_1.execFile, [1])('git', ['--no-pager', 'diff', '-p', '-U0', '--no-color', fromFile.path, toFile.path], {
                                        cwd: bufferInfo.gitDir
                                    })];
                            case 5:
                                diff = (_a.sent())[0];
                                resolve(parseDiff(diff));
                                return [3 /*break*/, 7];
                            case 6:
                                error_1 = _a.sent();
                                reject(error_1);
                                return [3 /*break*/, 7];
                            case 7: return [2 /*return*/];
                        }
                    });
                }); })];
        });
    });
}
exports.gitDiff = gitDiff;
// get git blame info
function gitBlame(params) {
    return new Promise(function () {
    });
}
exports.gitBlame = gitBlame;
/**
 * parse diff string to Diff
 *
 * diff string example:
 *
 * diff --git a/plugin/gitp.vim b/plugin/gitp.vim
 * index 7a55c07..b3df694 100644
 * --- a/plugin/gitp.vim
 * +++ b/plugin/gitp.vim
 * @@ -21,8 +21,14 @@ highlight GitPModifyHi guifg=#0000ff
 * -sign define GitPDeleteSign text=- texthl=GitPDeleteHi
 * ...
 */
function parseDiff(diffStr) {
    // split to lines and delete the first four lines and the last '\n'
    var allLines = diffStr.split('\n').slice(4, -1);
    // diff info
    var diff = {
        info: {},
        lines: {}
    };
    var info = diff.info, lines = diff.lines;
    // current diff key
    var diffKey;
    for (var _i = 0, allLines_1 = allLines; _i < allLines_1.length; _i++) {
        var line = allLines_1[_i];
        if (!line.startsWith('@@')) {
            if (diffKey && info[diffKey]) {
                info[diffKey].push(line);
            }
            continue;
        }
        var hunkKey = line.split('@@', 2)[1];
        // invalid format line
        if (!hunkKey) {
            continue;
        }
        // Diff key: -xx +yy
        diffKey = hunkKey.trim();
        info[diffKey] = [];
        var _a = diffKey
            .split(/\s+/)
            .map(function (str) { return str.slice(1).split(','); }), pres = _a[0], nows = _a[1];
        // delete
        if (nows[1] === '0') {
            lines[nows[0]] = {
                operate: constant_1.deleteBottomSymbol,
                diffKey: diffKey
            };
        }
        else {
            var deleteCount = parseInt("" + (pres[1] || 1), 10);
            var addCount = parseInt("" + (nows[1] || 1), 10);
            var lineNum = parseInt(nows[0], 10);
            for (var i = 0; i < addCount; i++) {
                // delete and add at the same line
                if (i < deleteCount) {
                    lines[lineNum + i] = {
                        operate: constant_1.modifySymbol,
                        diffKey: diffKey
                    };
                }
                else {
                    // add new line
                    lines[lineNum + i] = {
                        operate: constant_1.addSymbol,
                        diffKey: diffKey
                    };
                }
            }
        }
    }
    return diff;
}
exports.parseDiff = parseDiff;