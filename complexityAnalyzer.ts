import { Range } from 'vscode-languageserver/node';
import { SyntaxNode } from 'web-tree-sitter';

/**
 * Complexity result interface
 */
export interface ComplexityResult {
    complexity: string;
    range: Range;
    details?: string;
}

/**
 * Analyzes the AST to determine time complexity of functions
 * @param ast The abstract syntax tree
 * @param languageId The language ID
 * @returns Array of complexity results
 */
export function analyzeComplexity(ast: SyntaxNode, languageId: string): ComplexityResult[] {
    const results: ComplexityResult[] = [];
    
    // Find all function definitions in the AST
    const functionNodes = findFunctionNodes(ast, languageId);
    
    for (const node of functionNodes) {
        const complexity = calculateComplexity(node, languageId);
        
        // Create a range for the function
        const range = {
            start: {
                line: node.startPosition.row,
                character: node.startPosition.column
            },
            end: {
                line: node.endPosition.row,
                character: node.endPosition.column
            }
        };
        
        results.push({
            complexity,
            range,
            details: `Function analyzed with ${complexity} complexity`
        });
    }
    
    return results;
}

/**
 * Finds all function nodes in the AST
 * @param ast The abstract syntax tree
 * @param languageId The language ID
 * @returns Array of function nodes
 */
function findFunctionNodes(ast: SyntaxNode, languageId: string): SyntaxNode[] {
    const functionNodes: SyntaxNode[] = [];
    
    // Different languages have different node types for functions
    const functionNodeTypes = getFunctionNodeTypes(languageId);
    
    // Recursively traverse the AST to find function nodes
    traverseAST(ast, (node) => {
        if (functionNodeTypes.includes(node.type)) {
            functionNodes.push(node);
            return false; // Don't traverse into this node's children
        }
        return true; // Continue traversing
    });
    
    return functionNodes;
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

/**
 * Calculates the time complexity of a function
 * @param node The function node
 * @param languageId The language ID
 * @returns The time complexity as a string (O(1), O(n), etc.)
 */
function calculateComplexity(node: SyntaxNode, languageId: string): string {
    // Count nested loops
    const loopDepth = countNestedLoops(node, languageId);
    
    // Check for recursion
    const hasRecursion = checkForRecursion(node, languageId);
    
    // Check for sorting or other known algorithms
    const algorithmComplexity = checkForKnownAlgorithms(node, languageId);
    
    if (algorithmComplexity) {
        return algorithmComplexity;
    }
    
    if (hasRecursion) {
        // Simple heuristic for recursive functions
        // This is a simplification - actual recursive complexity depends on the algorithm
        return 'O(2^n)'; // Assume exponential for recursive functions without more analysis
    }
    
    // Determine complexity based on loop nesting
    switch (loopDepth) {
        case 0:
            return 'O(1)';
        case 1:
            return 'O(n)';
        case 2:
            return 'O(n²)';
        case 3:
            return 'O(n³)';
        default:
            return loopDepth > 3 ? `O(n^${loopDepth})` : 'O(n)';
    }
}

/**
 * Counts the maximum depth of nested loops in a function
 * @param node The function node
 * @param languageId The language ID
 * @returns The maximum loop nesting depth
 */
function countNestedLoops(node: SyntaxNode, languageId: string): number {
    const loopTypes = getLoopNodeTypes(languageId);
    let maxDepth = 0;
    
    function traverse(currentNode: SyntaxNode, currentDepth: number): void {
        if (loopTypes.includes(currentNode.type)) {
            currentDepth++;
            maxDepth = Math.max(maxDepth, currentDepth);
        }
        
        for (let i = 0; i < currentNode.childCount; i++) {
            const child = currentNode.child(i);
            if (child) {
                traverse(child, currentDepth);
            }
        }
    }
    
    traverse(node, 0);
    return maxDepth;
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
 * Checks if a function contains recursion
 * @param node The function node
 * @param languageId The language ID
 * @returns True if recursion is detected
 */
function checkForRecursion(node: SyntaxNode, languageId: string): boolean {
    // Get function name
    const functionName = getFunctionName(node, languageId);
    if (!functionName) {
        return false;
    }
    
    // Check if the function calls itself
    let hasRecursion = false;
    
    traverseAST(node, (currentNode) => {
        // Check if this is a call to the same function
        if (isCallToFunction(currentNode, functionName, languageId)) {
            hasRecursion = true;
            return false;
        }
        return !hasRecursion; // Stop traversing if recursion is found
    });
    
    return hasRecursion;
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
 * Checks for known algorithms that have well-defined complexities
 * @param node The function node
 * @param languageId The language ID
 * @returns The complexity as a string or undefined
 */
function checkForKnownAlgorithms(node: SyntaxNode, languageId: string): string | undefined {
    // Check for sorting algorithms
    if (containsSort(node, languageId)) {
        return 'O(n log n)';
    }
    
    // Check for binary search
    if (containsBinarySearch(node, languageId)) {
        return 'O(log n)';
    }
    
    return undefined;
}

/**
 * Checks if a function contains a sorting operation
 * @param node The function node
 * @param languageId The language ID
 * @returns True if a sort is detected
 */
function containsSort(node: SyntaxNode, languageId: string): boolean {
    let hasSort = false;
    
    traverseAST(node, (currentNode) => {
        // Check for common sorting method names
        if (currentNode.text && 
            (currentNode.text.includes('sort') || 
             currentNode.text.includes('Sort'))) {
            hasSort = true;
            return false;
        }
        return !hasSort; // Stop traversing if sort is found
    });
    
    return hasSort;
}

/**
 * Checks if a function contains a binary search
 * @param node The function node
 * @param languageId The language ID
 * @returns True if a binary search is detected
 */
function containsBinarySearch(node: SyntaxNode, languageId: string): boolean {
    let hasBinarySearch = false;
    
    traverseAST(node, (currentNode) => {
        // Check for binary search indicators
        if (currentNode.text && 
            (currentNode.text.includes('binary_search') || 
             currentNode.text.includes('binarySearch') ||
             currentNode.text.includes('BinarySearch'))) {
            hasBinarySearch = true;
            return false;
        }
        return !hasBinarySearch; // Stop traversing if binary search is found
    });
    
    return hasBinarySearch;
}