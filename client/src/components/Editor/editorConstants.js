// ============================================
// SUPPORTED LANGUAGES
// ============================================
export const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
];

// ============================================
// CODE TEMPLATES
// ============================================
export const CODE_TEMPLATES = {
  javascript: `// Welcome to SyncCanvas - JavaScript
function greet(name) {
  console.log(\`Hello, \${name}! Welcome to SyncCanvas\`);
  return { message: "Welcome to SyncCanvas", version: "2.0" };
}

// Example usage
const result = greet("Developer");
console.log("Result:", result);`,

  typescript: `// Welcome to SyncCanvas - TypeScript
interface User {
  name: string;
  age: number;
  isActive: boolean;
}

function greetUser(user: User): string {
  return \`Welcome \${user.name} to SyncCanvas!\`;
}

const user: User = {
  name: "Developer",
  age: 25,
  isActive: true
};

console.log(greetUser(user));`,

  python: `# Welcome to SyncCanvas - Python
import sys

def greet(name):
    print(f"Hello, {name}! Welcome to SyncCanvas")
    # Read stdin if input is provided under the Terminal tab
    user_input = sys.stdin.read().strip()
    if user_input:
        print(f"Received Input: {user_input}")
    return {"message": "Welcome to SyncCanvas", "version": "2.0"}

# Example usage
result = greet("Developer")
print("Returned:", result)`,

  java: `// Welcome to SyncCanvas - Java
import java.io.*;
import java.util.*;

public class SyncCanvas {
    public static void main(String[] args) throws IOException {
        System.out.println("🚀 Welcome to SyncCanvas!");
        
        // Read input from Terminal tab stdin
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String line = reader.readLine();
        if (line != null && !line.isEmpty()) {
            System.out.println("Input arguments: " + line);
        }
        
        User user = new User("Developer", 25);
        System.out.println("Hello, " + user.getName() + "!");
    }
}

class User {
    private String name;
    private int age;
    
    public User(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    public String getName() {
        return name;
    }
    
    public int getAge() {
        return age;
    }
}`,

  cpp: `// Welcome to SyncCanvas - C++
#include <iostream>
#include <string>

int main() {
    std::cout << "🚀 Welcome to SyncCanvas C++!" << std::endl;
    
    // Read input from Terminal tab stdin
    std::string custom_input;
    if (std::getline(std::cin, custom_input)) {
        std::cout << "Input arguments: " << custom_input << std::endl;
    }
    
    std::string user = "Developer";
    std::cout << "Hello, " << user << "!" << std::endl;
    return 0;
}`,

  c: `// Welcome to SyncCanvas - C
#include <stdio.h>

int main() {
    printf("🚀 Welcome to SyncCanvas C!\\n");
    char custom_input[256];
    if (fgets(custom_input, sizeof(custom_input), stdin)) {
        printf("Input arguments: %s", custom_input);
    }
    char user[] = "Developer";
    printf("Hello, %s!\\n", user);
    return 0;
}`,

  go: `// Welcome to SyncCanvas - Go
package main

import (
    "fmt"
    "os"
    "bufio"
)

func main() {
    fmt.Println("🚀 Welcome to SyncCanvas Go!")
    
    // Read input from Terminal tab stdin
    reader := bufio.NewReader(os.Stdin)
    text, _ := reader.ReadString('\\n')
    if text != "" {
        fmt.Printf("Input arguments: %s\\n", text)
    }
    
    user := "Developer"
    fmt.Printf("Hello, %s!\\n", user)
}`,

  rust: `// Welcome to SyncCanvas - Rust
use std::io::{self, BufRead};

fn main() {
    println!("🚀 Welcome to SyncCanvas Rust!");
    
    // Read input from Terminal tab stdin
    let stdin = io::stdin();
    if let Some(Ok(line)) = stdin.lock().lines().next() {
        println!("Input arguments: {}", line);
    }
    
    let user = "Developer";
    println!("Hello, {}!", user);
}`,

  ruby: `# Welcome to SyncCanvas - Ruby
puts "🚀 Welcome to SyncCanvas Ruby!"
# Read input from Terminal tab stdin
custom_input = gets
if custom_input
  puts "Input arguments: #{custom_input.strip}"
end
user = "Developer"
puts "Hello, #{user}!"`,

  php: `<?php
// Welcome to SyncCanvas - PHP
echo "🚀 Welcome to SyncCanvas PHP!\\n";
// Read input from Terminal tab stdin
$custom_input = fgets(STDIN);
if ($custom_input) {
  echo "Input arguments: " . trim($custom_input) . "\\n";
}
$user = "Developer";
echo "Hello, " . $user . "!\\n";
?>`,

  html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to SyncCanvas</title>
    <style>
        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: #09090b;
            color: #f4f4f5;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            text-align: center;
            padding: 2.5rem;
            border: 2px solid #6c5ce7;
            border-radius: 16px;
            background: #12121a;
            box-shadow: 0 8px 32px rgba(108, 92, 231, 0.2);
        }
        h1 {
            color: #a29bfe;
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }
        p {
            color: #a6adc8;
            font-size: 1.1rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Welcome to SyncCanvas</h1>
        <p>A full-featured collaborative workspace</p>
    </div>
</body>
</html>`,

  css: `/* Welcome to SyncCanvas - CSS */
body {
  background-color: #0d0e15;
  color: #e2e8f0;
  font-family: system-ui, sans-serif;
  padding: 2rem;
}

.box {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  padding: 20px;
  border-radius: 8px;
  font-weight: bold;
  text-align: center;
  margin-top: 15px;
}`,

  json: `{
  "name": "SyncCanvas",
  "version": "2.0",
  "description": "Welcome to SyncCanvas",
  "features": [
    "Collaborative Whiteboard",
    "Real-time Code Editor",
    "Live Code Runner"
  ]
}`,

  markdown: `# Welcome to SyncCanvas Code Editor

This is a **markdown file** template.

- Edit code collaboratively in real-time.
- Press **Run Code** to compile and test algorithms.
- Cursors and selections are shared.
`,
};
