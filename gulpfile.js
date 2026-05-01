import path from "path";
import gulp from "gulp";
import changed, {compareContents} from "gulp-changed";
import ImportAnalyzer from "emcjs/_build_tools/ImportAnalyzer.js";
import sourceImport from "./src/_build_tools/SourceImport.js";

const __dirname = path.resolve();

const IN_PATH = path.resolve(__dirname, "src");
const OUT_PATH = path.resolve(__dirname, "lib");

const REBUILD = process.argv.indexOf("-rebuild") >= 0;

console.log({REBUILD});

function copyJS() {
    const FILES = [
        `${IN_PATH}/**/*.js`,
        `!${IN_PATH}/*.js`,
        `!${IN_PATH}/_build_tools/*.js`
    ];
    let res = gulp.src(FILES);
    res = res.pipe(ImportAnalyzer.register(IN_PATH, OUT_PATH, __dirname));
    res = res.pipe(sourceImport());
    if (!REBUILD) {
        res = res.pipe(changed(OUT_PATH, {hasChanged: compareContents}));
    }
    res = res.pipe(gulp.dest(OUT_PATH));
    return res;
}

function copyCSS() {
    const FILES = [
        `${IN_PATH}/_style/**/*.css`
    ];
    let res = gulp.src(FILES);
    if (!REBUILD) {
        res = res.pipe(changed(`${OUT_PATH}/_style`));
    }
    res = res.pipe(gulp.dest(`${OUT_PATH}/_style`));
    return res;
}

function copyFonts() {
    const FILES = [
        `${IN_PATH}/_fonts/**/*.ttf`,
        `${IN_PATH}/_fonts/**/*.eot`,
        `${IN_PATH}/_fonts/**/*.otf`,
        `${IN_PATH}/_fonts/**/*.woff`,
        `${IN_PATH}/_fonts/**/*.woff2`,
        `${IN_PATH}/_fonts/**/*.svg`
    ];
    let res = gulp.src(FILES);
    if (!REBUILD) {
        res = res.pipe(changed(`${OUT_PATH}/_fonts`));
    }
    res = res.pipe(gulp.dest(`${OUT_PATH}/_fonts`));
    return res;
}

function finish(done) {
    ImportAnalyzer.printUnresolvedImports();
    // ImportAnalyzer.writeImportFile();
    done();
}

export const build = gulp.series(gulp.parallel(copyJS, copyCSS, copyFonts), finish);
