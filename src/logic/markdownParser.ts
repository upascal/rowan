// File: src/logic/markdownParser.ts
import { v4 as uuidv4 } from 'uuid';

export interface Task { // Add export
  id: string;
  text: string;
  completed: boolean;
  subtasks: Task[];
  indentation: number; // To track nesting level
}

export interface BlockGroup { // Add export
  id: string;
  heading: string;
  level: number;
  tasks: Task[]; // Changed from content: string
}

// Function to parse task lines and build hierarchy
function parseTasksFromString(content: string): Task[] {
  const lines = content.trim().split(/\r?\n/);
  const rootTasks: Task[] = [];
  const taskStack: Task[] = []; // Stack to keep track of parent tasks at different levels
  const taskRegex = /^(\s*)-\s+\[( |x)\]\s+(.*)$/; // Regex to capture indentation, status, and text

  for (const line of lines) {
    const match = line.match(taskRegex);
    if (match) {
      const indentation = match[1].length;
      const completed = match[2] === 'x';
      const text = match[3];

      const newTask: Task = {
        id: uuidv4(),
        text: text,
        completed: completed,
        subtasks: [],
        indentation: indentation,
      };

      // Determine parent based on indentation
      while (taskStack.length > 0 && indentation <= taskStack[taskStack.length - 1].indentation) {
        taskStack.pop(); // Pop until we find the correct parent level or stack is empty
      }

      if (taskStack.length === 0) {
        // This is a root-level task for this block
        rootTasks.push(newTask);
      } else {
        // This is a subtask of the task at the top of the stack
        taskStack[taskStack.length - 1].subtasks.push(newTask);
      }

      // Push the current task onto the stack as a potential parent for subsequent tasks
      taskStack.push(newTask);
    }
    // Ignore lines that don't match the task format
  }

  return rootTasks; // Return only the top-level tasks for this block
}


export function parseMarkdownToBlocks(text: string): BlockGroup[] {
  const lines = text.split(/\r?\n/);
  const blocks: BlockGroup[] = [];

  let currentBlock: BlockGroup | null = null;
  let currentContentLines: string[] = []; // Store lines for the current block

  for (const line of lines) {
    const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);

    if (headerMatch) {
      // If we have a current block and content lines, parse them
      if (currentBlock && currentContentLines.length > 0) {
        currentBlock.tasks = parseTasksFromString(currentContentLines.join('\n'));
        currentContentLines = []; // Reset for the new block
      }

      // Push the completed previous block (if any)
      if (currentBlock) {
        blocks.push(currentBlock);
      }

      // Start a new block
      const level = headerMatch[1].length;
      const heading = headerMatch[2];

      currentBlock = {
        id: uuidv4(),
        heading: heading,
        level: level,
        tasks: [] // Initialize tasks array
      };
    } else if (line.trim() !== '') { // Collect non-empty, non-header lines
      currentContentLines.push(line);
    }
  }

  // Handle the last block after the loop
  if (currentBlock) {
    if (currentContentLines.length > 0) {
      currentBlock.tasks = parseTasksFromString(currentContentLines.join('\n'));
    }
    blocks.push(currentBlock);
  }

  return blocks;
}
