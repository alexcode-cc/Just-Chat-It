#!/usr/bin/env python3
"""
Split TASK_SUMMARY.md into individual task files
"""

# Task line ranges (start_line, end_line)
TASKS = [
    (3, 280, "task-1.md"),
    (283, 479, "task-2.md"),
    (482, 773, "task-3.md"),
    (775, 1115, "task-4.md"),
    (1117, 1400, "task-5.md"),
    (1402, 1776, "task-6.md"),
    (1778, 2145, "task-7.md"),
    (2147, 2416, "task-8.md"),
    (2418, 2797, "task-9.md"),
]

def split_tasks():
    """Read TASK_SUMMARY.md and split into individual task files"""
    source_file = "/home/user/Just-Chat-It/TASK_SUMMARY.md"
    output_dir = "/home/user/Just-Chat-It/docs/tasks"

    # Read all lines from source file
    with open(source_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Process each task
    for start, end, filename in TASKS:
        # Extract lines (convert to 0-indexed)
        task_lines = lines[start-1:end]

        # Write to individual file
        output_path = f"{output_dir}/{filename}"
        with open(output_path, 'w', encoding='utf-8') as f:
            f.writelines(task_lines)

        print(f"Created {filename} ({end-start+1} lines)")

    print(f"\n✅ Successfully split {len(TASKS)} tasks into individual files")

if __name__ == "__main__":
    split_tasks()
