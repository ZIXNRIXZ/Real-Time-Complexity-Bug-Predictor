import { Range } from 'vscode-languageserver/node';
import { SyntaxNode } from 'web-tree-sitter';
import { ComplexityResult } from './complexityAnalyzer';

/**
 * Bug result interface
 */
export interface BugResult {
    message: string;
    range: Range;
    severity: 'warning' | 'error';
}

/**
 * Detects potential bugs in the code
 * @param ast The abstract syntax tree
 * @param languageId The language ID
 * @param complexityResults The complexity analysis results
 * @returns Array of bug results
 */
export function detectBugs(ast: SyntaxNode, languageId: string, complexityResults: ComplexityResult[]): BugResult[] {
    const results: BugResult[] = [];
    
    // Check for infinite loops
    const infiniteLoops = detectInfiniteLoops(ast, languageId);
    results.push(...infiniteLoops);
    
    // Check for recursion without base case
    const recursionIssues = detectRecursionWithoutBaseCase(ast, languageId);
    results.push(...recursionIssues);
    
    // Check for excessive complexity
    const complexityIssues = detectExcessiveComplexity(complexityResults);
    results.push(...complexityIssues);
    
    return results;
}

/**
 * Detects potential infinite loops
 * @param ast The abstract syntax tree
 * @param languageId The language ID
 * @returns Array of bug results
 */
function detectInfiniteLoops(ast: SyntaxNode, languageId: string): BugResult[] {
    const results: BugResult[] = [];
    const loopTypes = getLoopNodeTypes(languageId);
    
    // Traverse the AST to find loops
    traverseAST(ast, (node) => {
        if (loopTypes.includes(node.type)) {
            // Check if this loop might be infinite
            if (mightBeInfiniteLoop(node, languageId)) {
                results.push({
                    message: 'Potential infinite loop detected',
                    range: {
                        start: {
                            line: node.startPosition.row,
                            character: node.startPosition.column
                        },
                        end: {
                            line: node.endPosition.row,
                            character: node.endPosition.column
                        }
                    },
                    severity: 'error'
                });
            }
        }
        return true;
    });
    
    return results;
}

/**
 * Gets the node types that represent loops in different languages
 * @param languageId The language ID
 * @returns Array of node types
 */
function getLoopNodeTypes(languageId: string): string[] {
    switch (languageId) {
        case 'python':
            return ['for_statement', 'while_statement'];
        case 'cpp':
            return ['for_statement', 'while_statement', 'do_statement', 'for_range_loop'];
        case 'java':
            return ['for_statement', 'enhanced_for_statement', 'while_statement', 'do_statement'];
        case 'javascript':
        case 'typescript':
            return ['for_statement', 'for_in_statement', 'for_of_statement', 'while_statement', 'do_statement'];
        default:
            return [];
    }
}

/**
 * Checks if a loop might be infinite
 * @param node The loop node
 * @param languageId The language ID
 * @returns True if the loop might be infinite
 */
function mightBeInfiniteLoop(node: SyntaxNode, languageId: string): boolean {
    // Check for while(true) or for(;;)
    if (node.type.includes('while')) {
        const condition = node.childForFieldName('condition');
        if (condition && (condition.text === 'true' || condition.text === '1')) {
            // Check if there's a break statement inside
            return !hasBreakStatement(node);
        }
    }
    
    // Check for for loops without increment
    if (node.type.includes('for_statement')) {
        const increment = node.childForFieldName('increment');
        if (!increment || increment.text === '') {
            // Check if there's a break statement inside
            return !hasBreakStatement(node);
        }
    }
    
    return false;
}

/**
 * Checks if a node contains a break statement
 * @param node The node to check
 * @returns True if a break statement is found
 */
function hasBreakStatement(node: SyntaxNode): boolean {
    let hasBreak = false;
    
    traverseAST(node, (currentNode) => {
        if (currentNode.type === 'break_statement') {
            hasBreak = true;
            return false;
        }
        return !hasBreak;
    });
    
    return hasBreak;
}

/**
 * Detects recursion without a base case
 * @param ast The abstract syntax tree
 * @param languageId The language ID
 * @returns Array of bug results
 */
function detectRecursionWithoutBaseCase(ast: SyntaxNode, languageId: string): BugResult[] {
    const results: BugResult[] = [];
    const functionTypes = getFunctionNodeTypes(languageId);
    
    // Traverse the AST to find functions
    traverseAST(ast, (node) => {
        if (functionTypes.includes(node.type)) {
            // Get function name
            const functionName = getFunctionName(node, languageId);
            if (!functionName) {
                return true;
            }
            
            // Check if the function is recursive
            if (isRecursiveFunction(node, functionName, languageId)) {
                // Check if it has a base case
                if (!hasBaseCase(node, languageId)) {
                    results.push({
                        message: 'Recursive function without a clear base case',
                        range: {
                            start: {
                                line: node.startPosition.row,
                                character: node.startPosition.column
                            },
                            end: {
                                line: node.endPosition.row,
                                character: node.endPosition.column
                            }
                        },
                        severity: 'warning'
                    });
                }
            }
        }
        return true;
    });
    
    return results;
}

/**
 * Gets the node types that represent functions in different languages
 * @param languageId The language ID
 * @returns Array of node types
 */
function getFunctionNodeTypes(languageId: string): string[] {
    switch (languageId) {
        case 'python':
            return ['function_definition', 'class_definition'];
        case 'cpp':
            return ['function_definition', 'method_definition'];
        case 'java':
            return ['method_declaration', 'constructor_declaration'];
        case 'javascript':
        case 'typescript':
            return ['function_declaration', 'method_definition', 'arrow_function'];
        default:
            return [];
    }
}

/**
 * Gets the name of a function from its node
 * @param node The function node
 * @param languageId The language ID
 * @returns The function name or undefined
 */
function getFunctionName(node: SyntaxNode, languageId: string): string | undefined {
    // Different languages store function names in different places
    let nameNode: SyntaxNode | null = null;
    
    switch (languageId) {
        case 'python':
            nameNode = node.childForFieldName('name');
            break;
        case 'cpp':
        case 'java':
            nameNode = node.childForFieldName('name');
            break;
        case 'javascript':
        case 'typescript':
            nameNode = node.childForFieldName('name');
            break;
    }
    
    return nameNode?.text;
}

/**
 * Checks if a function is recursive
 * @param node The function node
 * @param functionName The function name
 * @param languageId The language ID
 * @returns True if the function is recursive
 */
function isRecursiveFunction(node: SyntaxNode, functionName: string, languageId: string): boolean {
    let isRecursive = false;
    
    traverseAST(node, (currentNode) => {
        // Check if this is a call to the same function
        if (isCallToFunction(currentNode, functionName, languageId)) {
            isRecursive = true;
            return false;
        }
        return !isRecursive;
    });
    
    return isRecursive;
}

/**
 * Checks if a node is a call to a specific function
 * @param node The node to check
 * @param functionName The function name to look for
 * @param languageId The language ID
 * @returns True if the node is a call to the function
 */
function isCallToFunction(node: SyntaxNode, functionName: string, languageId: string): boolean {
    // Different languages have different node types for function calls
    const callNodeTypes = getCallNodeTypes(languageId);
    
    if (!callNodeTypes.includes(node.type)) {
        return false;
    }
    
    // Check if the function name matches
    const calledFunctionName = getCalledFunctionName(node, languageId);
    return calledFunctionName === functionName;
}

/**
 * Gets the node types that represent function calls in different languages
 * @param languageId The language ID
 * @returns Array of node types
 */
function getCallNodeTypes(languageId: string): string[] {
    switch (languageId) {
        case 'python':
            return ['call'];
        case 'cpp':
            return ['call_expression'];
        case 'java':
            return ['method_invocation'];
        case 'javascript':
        case 'typescript':
            return ['call_expression'];
        default:
            return [];
    }
}

/**
 * Gets the name of the function being called
 * @param node The call node
 * @param languageId The language ID
 * @returns The function name or undefined
 */
function getCalledFunctionName(node: SyntaxNode, languageId: string): string | undefined {
    // Different languages store called function names in different places
    let nameNode: SyntaxNode | null = null;
    
    switch (languageId) {
        case 'python':
            nameNode = node.childForFieldName('function');
            break;
        case 'cpp':
            nameNode = node.childForFieldName('function');
            break;
        case 'java':
            nameNode = node.childForFieldName('name');
            break;
        case 'javascript':
        case 'typescript':
            nameNode = node.childForFieldName('function');
            break;
    }
    
    return nameNode?.text;
}

/**
 * Checks if a recursive function has a base case
 * @param node The function node
 * @param languageId The language ID
 * @returns True if a base case is detected
 */
function hasBaseCase(node: SyntaxNode, languageId: string): boolean {
    // Look for if statements or conditional returns
    let hasConditional = false;
    
    traverseAST(node, (currentNode) => {
        if (currentNode.type.includes('if_statement') || 
            currentNode.type.includes('conditional_expression')) {
            hasConditional = true;
            return false;
        }
        return !hasConditional;
    });
    
    return hasConditional;
}

/**
 * Detects excessive complexity
 * @param complexityResults The complexity analysis results
 * @returns Array of bug results
 */
function detectExcessiveComplexity(complexityResults: ComplexityResult[]): BugResult[] {
    const results: BugResult[] = [];
    
    for (const result of complexityResults) {
        // Check if complexity exceeds O(n²)
        if (result.complexity === 'O(n²)' || 
            result.complexity === 'O(n^3)' || 
            result.complexity === 'O(2^n)' || 
            (result.complexity.startsWith('O(n^') && parseInt(result.complexity.slice(4)) > 2)) {
            
            results.push({
                message: `High time complexity detected: ${result.complexity}`,
                range: result.range,
                severity: 'warning'
            });
        }
    }
    
    return results;
}

/**
 * Traverses the AST and calls the callback for each node
 * @param node The current node
 * @param callback The callback function
 */
function traverseAST(node: SyntaxNode, callback: (node: SyntaxNode) => boolean): void {
    if (!callback(node)) {
        return;
    }
    
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child) {
            traverseAST(child, callback);
        }
    }
}