# Real-Time Complexity & Bug Predictor

A VSCode extension that analyzes code complexity and predicts potential bugs in real-time across multiple programming languages.


## Features

- **Multi-language Support**: Works with Python, C++, Java, JavaScript, and TypeScript
- **Real-time Complexity Analysis**: Detects time complexity of functions (O(1), O(n), O(n log n), O(n²), etc.)
- **Bug Detection**: Identifies potential issues like:
  - Infinite loops
  - Recursion without base cases
  - Memory leaks
  - Null pointer exceptions
  - High complexity warnings
- **Inline Diagnostics**: Shows warnings and suggestions directly in your editor
- **Prepared for ML Integration**: Structure in place for future machine learning-based predictions

## Installation

### From Source
1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press F5 in VSCode to launch with the extension

## Requirements

- VSCode 1.60.0 or higher
- Node.js 14.0 or higher
- For development: TypeScript 4.5+

## How It Works

The extension uses Tree-sitter to parse code into an Abstract Syntax Tree (AST), then:

1. **Complexity Analysis**: Examines function structures, loops, and recursion to determine time complexity
2. **Bug Detection**: Uses heuristic rules to identify common programming mistakes
3. **LSP Integration**: Provides real-time feedback through VSCode's Language Server Protocol

## Usage

The extension activates automatically when you open supported files. You'll see:

- **Complexity Annotations**: Inline comments showing the time complexity of functions
- **Bug Warnings**: Highlighted code sections with potential issues
- **Quick Fixes**: Suggested solutions for detected problems (where applicable)

## Configuration

You can configure the extension in your VSCode settings:

```json
{
  "complexityPredictor.enabledLanguages": ["python", "javascript", "typescript", "cpp", "java"],
  "complexityPredictor.maxComplexityWarning": "O(n²)",
  "complexityPredictor.enableBugDetection": true
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact
Ping  me at zixriz2@gmail.com
