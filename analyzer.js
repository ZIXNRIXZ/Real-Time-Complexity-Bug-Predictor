"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeDocument = void 0;
const node_1 = require("vscode-languageserver/node");
const parser_1 = require("../parsers/parser");
const complexityAnalyzer_1 = require("./complexityAnalyzer");
const bugDetector_1 = require("./bugDetector");
/**
 * Analyzes a document for complexity and potential bugs
 * @param text The document text
 * @param languageId The language ID (python, cpp, java, javascript, typescript)
 * @returns Array of diagnostics
 */
async function analyzeDocument(text, languageId) {
    const diagnostics = [];
    try {
        // Parse the code to get AST
        const ast = await (0, parser_1.parseCode)(text, languageId);
        if (!ast) {
            return diagnostics;
        }
        // Analyze complexity
        const complexityResults = (0, complexityAnalyzer_1.analyzeComplexity)(ast, languageId);
        // Add complexity diagnostics
        for (const result of complexityResults) {
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Information,
                range: result.range,
                message: `Time Complexity: ${result.complexity}`,
                source: 'Complexity Analyzer'
            });
        }
        // Detect potential bugs
        const bugResults = (0, bugDetector_1.detectBugs)(ast, languageId, complexityResults);
        // Add bug diagnostics
        for (const bug of bugResults) {
            diagnostics.push({
                severity: bug.severity === 'error' ? node_1.DiagnosticSeverity.Error : node_1.DiagnosticSeverity.Warning,
                range: bug.range,
                message: bug.message,
                source: 'Bug Detector'
            });
        }
    }
    catch (error) {
        console.error(`Error analyzing document: ${error}`);
    }
    return diagnostics;
}
exports.analyzeDocument = analyzeDocument;
//# sourceMappingURL=analyzer.js.map