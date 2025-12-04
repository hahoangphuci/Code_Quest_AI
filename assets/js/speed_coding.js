// Speed Coding Game JavaScript

// Game state variables
let currentChallenge = null;
let gameTimer = null;
let timeLeft = 0;
let gameActive = false;
let streak = 0;
let typingStats = {
  startTime: null,
  correctChars: 0,
  totalChars: 0,
  wpm: 0,
  accuracy: 100,
};

// AI Challenge Generation System
const difficultySettings = {
  beginner: {
    name: "Beginner",
    timeLimit: 120, // 2 phút
    maxErrors: 8,
    wpmTarget: 15,
    topics: ["functions", "variables", "loops", "conditions"],
    complexity: "basic",
  },
  intermediate: {
    name: "Intermediate",
    timeLimit: 180, // 3 phút
    maxErrors: 5,
    wpmTarget: 25,
    topics: ["classes", "lists", "dictionaries", "file_handling"],
    complexity: "medium",
  },
  expert: {
    name: "Expert",
    timeLimit: 240, // 4 phút
    maxErrors: 3,
    wpmTarget: 40,
    topics: ["algorithms", "recursion", "data_structures", "optimization"],
    complexity: "advanced",
  },
  tournament: {
    name: "Tournament",
    timeLimit: 300, // 5 phút
    maxErrors: 1,
    wpmTarget: 60,
    topics: [
      "design_patterns",
      "graph_theory",
      "dynamic_programming",
      "complex_algorithms",
    ],
    complexity: "expert",
  },
};

// AI Code Templates by Topic
const codeTemplates = {
  // BEGINNER TEMPLATES
  functions: [
    {
      template: `def {func_name}({params}):
    {body}
    return {return_val}

print({func_name}({test_args}))`,
      variables: {
        func_name: [
          "calculate_area",
          "get_greeting",
          "find_max",
          "convert_temp",
        ],
        params: ["length, width", "name", "a, b", "celsius"],
        body: [
          "    area = length * width",
          '    greeting = f"Hello, {name}!"',
          "    return a if a > b else b",
          "    fahrenheit = celsius * 9/5 + 32",
        ],
        return_val: ["area", "greeting", "max_value", "fahrenheit"],
        test_args: ["10, 5", '"World"', "15, 8", "25"],
      },
    },
    {
      template: `def {func_name}({param}):
    if {condition}:
        return {true_val}
    else:
        return {false_val}

result = {func_name}({test_val})
print(f"Result: {result}")`,
      variables: {
        func_name: ["check_even", "is_positive", "grade_status", "can_vote"],
        param: ["number", "num", "score", "age"],
        condition: ["number % 2 == 0", "num > 0", "score >= 70", "age >= 18"],
        true_val: ['"Even"', '"Positive"', '"Pass"', '"Can vote"'],
        false_val: ['"Odd"', '"Negative"', '"Fail"', '"Too young"'],
        test_val: ["10", "5", "85", "20"],
      },
    },
  ],

  loops: [
    {
      template: `def {func_name}({param}):
    result = {init_val}
    for i in range({range_val}):
        {loop_body}
    return result

print({func_name}({test_arg}))`,
      variables: {
        func_name: ["sum_numbers", "factorial", "power", "count_digits"],
        param: ["n", "num", "base, exp", "number"],
        init_val: ["0", "1", "1", "0"],
        range_val: ["1, n + 1", "1, num + 1", "exp", "len(str(number))"],
        loop_body: [
          "        result += i",
          "        result *= i",
          "        result *= base",
          "        result += 1",
        ],
        test_arg: ["5", "5", "2, 3", "12345"],
      },
    },
  ],

  // INTERMEDIATE TEMPLATES
  classes: [
    {
      template: `class {class_name}:
    def __init__(self, {init_params}):
        {init_body}
    
    def {method_name}(self, {method_params}):
        {method_body}
        return {method_return}

{instance} = {class_name}({init_args})
print({instance}.{method_name}({method_args}))`,
      variables: {
        class_name: ["Calculator", "BankAccount", "Student", "Rectangle"],
        init_params: ["", "initial_balance", "name, grade", "width, height"],
        init_body: [
          "        pass",
          "        self.balance = initial_balance",
          "        self.name = name\n        self.grade = grade",
          "        self.width = width\n        self.height = height",
        ],
        method_name: ["add", "withdraw", "get_status", "get_area"],
        method_params: ["a, b", "amount", "", ""],
        method_body: [
          "        result = a + b",
          "        self.balance -= amount",
          '        status = "Pass" if self.grade >= 70 else "Fail"',
          "        area = self.width * self.height",
        ],
        method_return: [
          "result",
          "self.balance",
          'f"{self.name}: {status}"',
          "area",
        ],
        instance: ["calc", "account", "student", "rect"],
        init_args: ["", "1000", '"Alice", 85', "10, 5"],
        method_args: ["5, 3", "200", "", ""],
      },
    },
  ],

  // EXPERT TEMPLATES
  algorithms: [
    {
      template: `def {algo_name}(arr):
    if len(arr) <= 1:
        return arr
    
    {algo_body}
    
    return {return_statement}

test_array = {test_data}
result = {algo_name}(test_array.copy())
print(f"Sorted: {result}")`,
      variables: {
        algo_name: ["quicksort", "mergesort", "bubble_sort"],
        algo_body: [
          `    pivot = arr[0]\n    left = [x for x in arr[1:] if x <= pivot]\n    right = [x for x in arr[1:] if x > pivot]\n    return quicksort(left) + [pivot] + quicksort(right)`,
          `    mid = len(arr) // 2\n    left = mergesort(arr[:mid])\n    right = mergesort(arr[mid:])\n    return merge(left, right)`,
          `    n = len(arr)\n    for i in range(n):\n        for j in range(0, n - i - 1):\n            if arr[j] > arr[j + 1]:\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]`,
        ],
        return_statement: ["", "", "arr"],
        test_data: [
          "[64, 34, 25, 12, 22, 11, 90]",
          "[38, 27, 43, 3, 9, 82, 10]",
          "[45, 23, 67, 12, 89, 34]",
        ],
      },
    },
  ],
};

// AI Code Generator
function generateChallenge(difficulty) {
  const settings = difficultySettings[difficulty];
  const availableTopics = settings.topics;

  // Random topic selection
  const selectedTopic =
    availableTopics[Math.floor(Math.random() * availableTopics.length)];
  const templates = codeTemplates[selectedTopic] || [];

  if (templates.length === 0) {
    // Fallback for missing templates
    return generateFallbackChallenge(difficulty);
  }

  // Random template selection
  const template = templates[Math.floor(Math.random() * templates.length)];

  // Generate random variables
  const generatedCode = generateCodeFromTemplate(template);

  const challenge = {
    id: `ai-${difficulty}-${Date.now()}`,
    title: generateChallengeTitle(selectedTopic, settings.complexity),
    level: settings.name,
    description: generateDescription(selectedTopic, settings.complexity),
    code: generatedCode,
    timeLimit: settings.timeLimit,
    maxErrors: settings.maxErrors,
    topic: selectedTopic,
    aiGenerated: true,
  };

  return challenge;
}

function generateCodeFromTemplate(template) {
  let code = template.template;
  const variables = template.variables;

  // Replace each variable with random selection
  Object.keys(variables).forEach((varName) => {
    const options = variables[varName];
    const selectedOption = options[Math.floor(Math.random() * options.length)];
    const regex = new RegExp(`{${varName}}`, "g");
    code = code.replace(regex, selectedOption);
  });

  return code;
}

function generateChallengeTitle(topic, complexity) {
  const titleTemplates = {
    functions: [
      "Function Master",
      "Code Function Pro",
      "Function Builder",
      "Basic Function Challenge",
    ],
    loops: [
      "Loop Expert",
      "Iteration Master",
      "Loop Challenge Pro",
      "Repetition Coder",
    ],
    classes: [
      "OOP Master",
      "Class Builder Pro",
      "Object Oriented Challenge",
      "Class Design Expert",
    ],
    algorithms: [
      "Algorithm Genius",
      "Sorting Master",
      "Algorithm Challenge",
      "Data Structure Pro",
    ],
    conditions: [
      "Logic Master",
      "Conditional Pro",
      "Decision Maker",
      "Boolean Expert",
    ],
    lists: [
      "List Manipulator",
      "Array Master",
      "Collection Pro",
      "List Expert",
    ],
    dictionaries: [
      "Dict Master",
      "Key-Value Pro",
      "Map Expert",
      "Dictionary Wizard",
    ],
    recursion: [
      "Recursion Master",
      "Recursive Thinking",
      "Stack Overflow Pro",
      "Recursive Logic",
    ],
    design_patterns: [
      "Pattern Master",
      "Design Pro",
      "Architecture Expert",
      "Pattern Wizard",
    ],
    graph_theory: [
      "Graph Explorer",
      "Network Master",
      "Graph Theory Pro",
      "Connection Expert",
    ],
    dynamic_programming: [
      "DP Master",
      "Optimization Pro",
      "Dynamic Challenge",
      "Memoization Expert",
    ],
  };

  const templates = titleTemplates[topic] || [
    "Coding Challenge",
    "Programming Test",
    "Code Master",
    "Dev Challenge",
  ];
  const baseTitle = templates[Math.floor(Math.random() * templates.length)];

  const prefixes = {
    basic: ["Basic", "Simple", "Easy", "Starter"],
    medium: ["Intermediate", "Advanced", "Pro", "Challenge"],
    advanced: ["Expert", "Master", "Elite", "Hardcore"],
    expert: ["Legendary", "Ultimate", "Supreme", "Godlike"],
  };

  const prefix =
    prefixes[complexity][
      Math.floor(Math.random() * prefixes[complexity].length)
    ];
  return `${prefix} ${baseTitle}`;
}

function generateDescription(topic, complexity) {
  const descriptions = {
    functions: {
      basic: "Viết function đơn giản với parameters và return value",
      medium: "Tạo function xử lý logic phức tạp với multiple conditions",
      advanced:
        "Implement advanced function với error handling và optimization",
      expert: "Design complex function architecture với advanced patterns",
    },
    loops: {
      basic: "Sử dụng vòng lặp for/while để xử lý dữ liệu cơ bản",
      medium: "Nested loops và advanced iteration techniques",
      advanced: "Optimal loop algorithms với performance optimization",
      expert: "Complex iterative algorithms với advanced data structures",
    },
    classes: {
      basic: "Tạo class đơn giản với constructor và methods",
      medium: "OOP advanced với inheritance và encapsulation",
      advanced: "Complex class design với design patterns",
      expert: "Enterprise-level class architecture và advanced OOP",
    },
    algorithms: {
      basic: "Basic sorting và searching algorithms",
      medium: "Intermediate algorithms với optimal time complexity",
      advanced: "Advanced algorithms với complex data structures",
      expert: "Expert-level algorithms và optimization techniques",
    },
  };

  return (
    descriptions[topic]?.[complexity] ||
    "AI-generated coding challenge để test tốc độ và accuracy"
  );
}

function generateFallbackChallenge(difficulty) {
  const settings = difficultySettings[difficulty];
  const fallbackCodes = {
    beginner: `def hello_world():
    message = "Hello, World!"
    return message

print(hello_world())`,
    intermediate: `class SimpleCalculator:
    def __init__(self):
        self.result = 0
    
    def add(self, x, y):
        self.result = x + y
        return self.result

calc = SimpleCalculator()
print(calc.add(10, 5))`,
    expert: `def fibonacci(n, memo={}):
    if n in memo:
        return memo[n]
    if n <= 2:
        return 1
    memo[n] = fibonacci(n-1, memo) + fibonacci(n-2, memo)
    return memo[n]

for i in range(1, 11):
    print(f"F({i}) = {fibonacci(i)}")`,
    tournament: `class BinaryTree:
    def __init__(self, data):
        self.data = data
        self.left = None
        self.right = None
    
    def insert(self, data):
        if data < self.data:
            if self.left is None:
                self.left = BinaryTree(data)
            else:
                self.left.insert(data)
        else:
            if self.right is None:
                self.right = BinaryTree(data)
            else:
                self.right.insert(data)

tree = BinaryTree(50)
for val in [30, 70, 20, 40]:
    tree.insert(val)`,
  };

  return {
    id: `fallback-${difficulty}-${Date.now()}`,
    title: `${settings.name} Fallback Challenge`,
    level: settings.name,
    description: `Fallback ${settings.name.toLowerCase()} challenge`,
    code: fallbackCodes[difficulty],
    timeLimit: settings.timeLimit,
    maxErrors: settings.maxErrors,
    aiGenerated: true,
  };
}

// Main function to handle challenge selection
function selectChallenge(difficulty) {
  // Show loading notification
  showNotification("🤖 AI đang sinh đề bài...", "info");

  // Generate AI challenge with realistic delay
  setTimeout(() => {
    currentChallenge = generateChallenge(difficulty);

    if (!currentChallenge) {
      showNotification("❌ Lỗi khi sinh đề bài!", "error");
      return;
    }

    showNotification(`🎯 AI đã tạo: ${currentChallenge.title}`, "success");

    // Hide challenge selection and show game arena
    document.getElementById("challenge-selection").style.display = "none";
    document.getElementById("speed-arena").style.display = "block";

    initializeChallenge();
  }, 1200); // Simulate AI processing time
}

function initializeChallenge() {
  if (!currentChallenge) return;

  // Reset game state
  gameActive = false;
  timeLeft = currentChallenge.timeLimit;
  typingStats = {
    startTime: null,
    correctChars: 0,
    totalChars: 0,
    wpm: 0,
    accuracy: 100,
  };

  // Update UI elements
  document.getElementById("challenge-info").innerHTML = `
        <h3>${currentChallenge.title}</h3>
        <div class="challenge-details">
            <span class="challenge-level ${currentChallenge.level.toLowerCase()}">${
    currentChallenge.level
  }</span>
            <span class="time-limit">${currentChallenge.timeLimit}s</span>
            <span class="max-errors">Max ${
              currentChallenge.maxErrors
            } errors</span>
        </div>
        <p>${currentChallenge.description}</p>
    `;

  document.getElementById("code-target").textContent = currentChallenge.code;
  document.getElementById("speed-code-editor").value = "";
  document.getElementById("timer-display").textContent = formatTime(timeLeft);

  updateStats();

  // Focus on editor
  document.getElementById("speed-code-editor").focus();
}

function startGame() {
  if (gameActive || !currentChallenge) return;

  gameActive = true;
  typingStats.startTime = Date.now();

  // Start countdown timer
  gameTimer = setInterval(() => {
    timeLeft--;
    document.getElementById("timer-display").textContent = formatTime(timeLeft);

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);

  showNotification("Trò chơi bắt đầu! Gõ nhanh nhất có thể!", "info");
  document.querySelector(".start-btn").disabled = true;
}

function endGame() {
  gameActive = false;
  if (gameTimer) {
    clearInterval(gameTimer);
    gameTimer = null;
  }

  calculateFinalScore();
  showResults();
  document.querySelector(".start-btn").disabled = false;
}

function resetGame() {
  if (gameTimer) {
    clearInterval(gameTimer);
    gameTimer = null;
  }

  gameActive = false;
  document.querySelector(".start-btn").disabled = false;

  if (currentChallenge) {
    initializeChallenge();
  }
}

function updateStats() {
  if (!typingStats.startTime) return;

  const editor = document.getElementById("speed-code-editor");
  const userText = editor.value;
  const targetText = currentChallenge ? currentChallenge.code : "";

  // Calculate accuracy
  let correctChars = 0;
  const minLength = Math.min(userText.length, targetText.length);

  for (let i = 0; i < minLength; i++) {
    if (userText[i] === targetText[i]) {
      correctChars++;
    }
  }

  typingStats.correctChars = correctChars;
  typingStats.totalChars = userText.length;
  typingStats.accuracy =
    typingStats.totalChars > 0
      ? Math.round((correctChars / typingStats.totalChars) * 100)
      : 100;

  // Calculate WPM
  const timeElapsed = (Date.now() - typingStats.startTime) / 1000 / 60; // in minutes
  const wordsTyped = userText.length / 5; // Standard: 5 characters = 1 word
  typingStats.wpm = timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0;

  // Update UI
  document.getElementById("wpm-display").textContent = typingStats.wpm;
  document.getElementById("accuracy-display").textContent =
    typingStats.accuracy + "%";
  document.getElementById("streak-display").textContent = streak;

  // Check if challenge is completed
  if (userText === targetText && gameActive) {
    streak++;
    endGame();
    showNotification("Hoàn thành thử thách! Xuất sắc!", "success");
  }
}

function calculateFinalScore() {
  if (!currentChallenge) return 0;

  const timeBonus = Math.max(0, timeLeft / currentChallenge.timeLimit) * 100;
  const accuracyBonus = typingStats.accuracy;
  const speedBonus = Math.min(100, typingStats.wpm * 2);
  const completionBonus =
    (typingStats.totalChars / currentChallenge.code.length) * 100;

  const finalScore =
    (timeBonus + accuracyBonus + speedBonus + completionBonus) / 4;
  return Math.round(finalScore);
}

function showResults() {
  const score = calculateFinalScore();

  // Hide arena, show results
  document.getElementById("speed-arena").style.display = "none";
  document.getElementById("results-screen").style.display = "block";

  // Update result displays
  document.getElementById("final-time").textContent = formatTime(
    currentChallenge.timeLimit - timeLeft
  );
  document.getElementById("final-wpm").textContent = typingStats.wpm;
  document.getElementById("final-accuracy").textContent =
    typingStats.accuracy + "%";
  document.getElementById("final-score").textContent = score;

  // Show performance level
  let performance = "";
  if (score >= 90) {
    performance =
      '<div class="performance excellent"><i class="fas fa-trophy"></i> Xuất sắc!</div>';
  } else if (score >= 70) {
    performance =
      '<div class="performance good"><i class="fas fa-thumbs-up"></i> Tốt lắm!</div>';
  } else if (score >= 50) {
    performance =
      '<div class="performance average"><i class="fas fa-hand-paper"></i> Khá ổn!</div>';
  } else {
    performance =
      '<div class="performance needs-improvement"><i class="fas fa-hand-point-up"></i> Cần cải thiện!</div>';
  }

  document.getElementById("performance-level").innerHTML = performance;

  // Show achievements
  const achievements = [];
  if (typingStats.accuracy === 100) achievements.push("Độ Chính Xác Hoàn Hảo");
  if (typingStats.wpm >= 60) achievements.push("Thánh Tốc Độ");
  if (timeLeft > currentChallenge.timeLimit * 0.5)
    achievements.push("Bậc Thầy Thời Gian");
  if (streak >= 3) achievements.push("Chuỗi Thắng Liên Tiếp");
  if (
    typingStats.wpm >=
    difficultySettings[currentChallenge.level.toLowerCase()]?.wpmTarget
  )
    achievements.push("Vượt Chỉ Tiêu");

  const achievementsList = document.getElementById("achievements-list");
  achievementsList.innerHTML =
    achievements.length > 0
      ? achievements
          .map((ach) => `<span class="achievement">${ach}</span>`)
          .join("")
      : '<span class="no-achievements">Chưa có thành tựu nào trong lượt này</span>';
}

function playAgain() {
  document.getElementById("results-screen").style.display = "none";
  document.getElementById("speed-arena").style.display = "block";
  initializeChallenge();
}

function backToSelection() {
  document.getElementById("results-screen").style.display = "none";
  document.getElementById("speed-arena").style.display = "none";
  document.getElementById("challenge-selection").style.display = "block";
  currentChallenge = null;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

function showNotification(message, type = "info") {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.className = `notification ${type} show`;

  setTimeout(() => {
    notification.classList.remove("show");
  }, 3000);
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", function () {
  const editor = document.getElementById("speed-code-editor");
  if (editor) {
    editor.addEventListener("input", function (e) {
      if (!gameActive && typingStats.startTime === null) {
        // Auto-start game on first keystroke
        startGame();
      }
      if (gameActive) {
        updateStats();
      }
    });

    editor.addEventListener("keydown", function (e) {
      // Prevent tab key from leaving the editor
      if (e.key === "Tab") {
        e.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;
        this.value =
          this.value.substring(0, start) + "    " + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 4;
      }
    });
  }

  // Setup start button
  const startBtn = document.querySelector(".start-btn");
  if (startBtn) {
    startBtn.addEventListener("click", startGame);
  }

  // Setup reset button
  const resetBtn = document.querySelector(".reset-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", resetGame);
  }
});
