import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import { parseCode } from '../parsers/parser';
import { analyzeComplexity } from './complexityAnalyzer';
import { detectBugs } from './bugDetector';

/**
 * Analyzes a document for complexity and potential bugs
 * @param text The document text
 * @param languageId The language ID (python, cpp, java, javascript, typescript)
 * @returns Array of diagnostics
 */
export async function analyzeDocument(text: string, languageId: string): Promise<Diagnostic[]> {
    const diagnostics: Diagnostic[] = [];
    
    try {
        // Parse the code to get AST
        const ast = await parseCode(text, languageId);
        
        if (!ast) {
            return diagnostics;
        }
        
        // Analyze complexity
        const complexityResults = analyzeComplexity(ast, languageId);
        
        // Add complexity diagnostics
        for (const result of complexityResults) {
            diagnostics.push({
                severity: DiagnosticSeverity.Information,
                range: result.range,
                message: `Time Complexity: ${result.complexity}`,
                source: 'Complexity Analyzer'
            });
        }
        
        // Detect potential bugs
        const bugResults = detectBugs(ast, languageId, complexityResults);
        
        // Add bug diagnostics
        for (const bug of bugResults) {
            diagnostics.push({
                severity: bug.severity === 'error' ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning,
                range: bug.range,
                message: bug.message,
                source: 'Bug Detector'
            });
        }
    } catch (error) {
        console.error(`Error analyzing document: ${error}`);
    }
    
    return diagnostics;
}