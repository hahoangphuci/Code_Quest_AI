/* ==================== AI DASHBOARD JAVASCRIPT ==================== */
/* Advanced AI-powered functionality for CodeQuest Dashboard */

// Global Variables
let currentLanguage = "Python";
let currentMode = "learning";
let aiEditor = null;
let userStats = {
  level: 1,
  xp: 150,
  streak: 7,
  points: 2450,
  accuracy: 0,
  speed: 0,
  quizScore: 0,
};

// AI Service Configuration - OpenRouter Multi-Model Support
const AI_CONFIG = {
  API_KEY:
    "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",
  PROVIDER: "openrouter",
  MODEL: "openai/gpt-4o-mini", // Default model
  AVAILABLE_MODELS: [
    "openai/gpt-4o",
    "openai/gpt-4o-mini",
    "google/gemini-2.0-flash-exp:free",
    "google/gemini-pro",
    "anthropic/claude-3-haiku",
    "meta-llama/llama-3.1-8b-instruct:free",
  ],
  ENDPOINTS: {
    chat: "https://openrouter.ai/api/v1/chat/completions",
    models: "https://openrouter.ai/api/v1/models",
  },
  HEADERS: {
    "HTTP-Referer": "https://codequest-ai.vercel.app",
    "X-Title": "CodeQuest AI Learning Platform",
  },
};

// ==================== AI CORE FUNCTIONS ====================

/**
 * Enhanced AI text generation using OpenRouter API with multiple model support
 */
async function generateText(prompt, model = AI_CONFIG.MODEL) {
  const url = AI_CONFIG.ENDPOINTS.chat;

  console.log("🔍 generateText called with OpenRouter:", {
    promptLength: prompt.length,
    apiKey: AI_CONFIG.API_KEY.substring(0, 15) + "...",
    model: model,
    provider: AI_CONFIG.PROVIDER,
    url: url,
  });

  try {
    const requestBody = {
      model: model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.95,
      stream: false,
    };

    console.log("📤 Sending request to OpenRouter API...");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_CONFIG.API_KEY}`,
        "HTTP-Referer": AI_CONFIG.HEADERS["HTTP-Referer"],
        "X-Title": AI_CONFIG.HEADERS["X-Title"],
      },
      body: JSON.stringify(requestBody),
    });

    console.log("📥 Response received:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`❌ OpenRouter API Error ${response.status}:`, errorData);

      // Show user-friendly error notification
      showAINotification(
        `❌ Lỗi API (${response.status}): ${
          response.status === 429
            ? "Hết quota"
            : response.status === 402
            ? "Hết credit"
            : "Lỗi kết nối"
        }`,
        "warning",
        5000
      );

      // Handle specific errors
      if (response.status === 429 || response.status === 402) {
        return handleQuotaExceeded(prompt);
      }

      throw new Error(`HTTP ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    console.log("🔍 OpenRouter Response data:", data);

    const result = data.choices?.[0]?.message?.content || "";

    if (!result) {
      console.error("❌ Empty result from OpenRouter response:", data);
      throw new Error("Empty response from AI");
    }

    console.log(
      "✅ AI response received successfully:",
      result.substring(0, 100) + "..."
    );
    return result;
  } catch (error) {
    console.error("💥 AI Generation Error:", {
      message: error.message,
      stack: error.stack,
      prompt: prompt.substring(0, 100) + "...",
      model: model,
    });

    // Show specific error to user
    showAINotification(
      `⚠️ AI gặp lỗi: ${error.message}. Sử dụng nội dung offline.`,
      "warning",
      6000
    );

    return getOfflineResponse(prompt, error.message);
  }
}

/**
 * Enhanced AI function with context support
 */
async function callAI(prompt, context = {}) {
  const contextualPrompt = `Context: You are an AI tutor for CodeQuest, a coding learning platform. User's current language: ${currentLanguage}. User stats: ${JSON.stringify(
    userStats
  )}. ${
    context.additionalContext || ""
  }\n\nUser request: ${prompt}\n\nPlease respond in Vietnamese and keep it concise and helpful.`;

  return await generateText(contextualPrompt);
}

/**
 * Handle quota exceeded error with helpful guidance
 */
function handleQuotaExceeded(originalPrompt) {
  showAINotification(
    "🚫 API đã hết quota! Sử dụng chế độ offline hoặc thử lại sau.",
    "warning",
    8000
  );

  updateTutorStatus("Hết quota - Chế độ offline");

  return getOfflineResponse(originalPrompt, "Quota exceeded");
}

/**
 * Get intelligent offline response with clear debugging markers
 */
function getOfflineResponse(prompt, errorContext = "") {
  console.log("🔄 Generating offline response for:", {
    promptType: prompt.substring(0, 50),
    errorContext: errorContext,
  });

  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes("lesson") || lowerPrompt.includes("bài học")) {
    return `🚨 [OFFLINE MODE] 📚 **${currentLanguage} - Bài học offline**\n\nℹ️ **Lý do offline:** ${errorContext}\n\n🎯 **Nội dung cơ bản:**\n${getLanguageLessonContent(
      currentLanguage
    )}\n\n💡 **Gợi ý thực hành:**\n• Sử dụng Monaco Editor để thử nghiệm\n• Bắt đầu với ví dụ đơn giản\n• Dần dần tăng độ phức tạp\n\n🔄 Hãy kiểm tra API key và thử lại!`;
  }

  if (lowerPrompt.includes("challenge") || lowerPrompt.includes("thử thách")) {
    return `🚨 [OFFLINE MODE] 🎯 **Thử thách ${currentLanguage} offline:**\n\nℹ️ **Lý do offline:** ${errorContext}\n\n${getLanguageChallengeContent(
      currentLanguage
    )}\n\n💡 **Hướng dẫn:**\n• Đọc kỹ yêu cầu\n• Chia nhỏ bài toán\n• Code từng bước\n• Test kỹ lưỡng\n\n🔄 Hãy kiểm tra API key và thử lại!`;
  }

  if (lowerPrompt.includes("quiz") || lowerPrompt.includes("câu hỏi")) {
    return `🚨 [OFFLINE MODE] 🧩 **Quiz ${currentLanguage} offline:**\n\nℹ️ **Lý do offline:** ${errorContext}\n\n${getLanguageQuizContent(
      currentLanguage
    )}\n\n🎯 **Cách sử dụng:**\n• Đọc câu hỏi kỹ\n• Suy nghĩ trước khi chọn\n• Học từ các đáp án\n\n🔄 Hãy kiểm tra API key và thử lại!`;
  }

  // Generic offline response with clear indication
  return `🚨 [OFFLINE MODE] 🤖 **AI không khả dụng**\n\nℹ️ **Lý do:** ${errorContext}\n\n⚡ **Tính năng có sẵn:**\n• 💻 Monaco Editor với syntax highlighting\n• 🎯 Thử thách coding offline\n• 📚 Bài học cơ bản ${currentLanguage}\n• 🧩 Quiz practice\n• 🏆 Leaderboard và stats\n\n🔧 **Cách khắc phục:**\n• Kiểm tra API key có đúng không\n• Thử refresh trang\n• Kiểm tra kết nối internet\n\n🔄 Hãy test lại kết nối AI!`;
}

/**
 * Language-specific lesson content
 */
function getLanguageLessonContent(language) {
  const lessons = {
    Python:
      '🐍 **Python Basics:**\n• Variables: `name = "Python"`\n• Lists: `numbers = [1, 2, 3]`\n• Loops: `for i in range(5):`\n• Functions: `def greet(name):`',
    JavaScript:
      '⚡ **JavaScript Basics:**\n• Variables: `let name = "JS";`\n• Arrays: `const numbers = [1, 2, 3];`\n• Functions: `const greet = (name) => {}`\n• DOM: `document.getElementById("id")`',
    Java: "☕ **Java Basics:**\n• Class: `public class Main {}`\n• Variables: `int number = 10;`\n• Methods: `public void greet() {}`\n• Arrays: `int[] numbers = {1, 2, 3};`",
    "C++":
      "⚡ **C++ Basics:**\n• Headers: `#include <iostream>`\n• Variables: `int number = 10;`\n• Functions: `void greet() {}`\n• Arrays: `int numbers[] = {1, 2, 3};`",
    Rust: '🦀 **Rust Basics:**\n• Variables: `let name = "Rust";`\n• Functions: `fn greet(name: &str) {}`\n• Vectors: `let numbers = vec![1, 2, 3];`\n• Match: `match value { ... }`',
  };

  return lessons[language] || lessons["Python"];
}

/**
 * Language-specific challenge content
 */
function getLanguageChallengeContent(language) {
  const challenges = {
    Python:
      '**Level 1:** Print "Hello World"\n**Level 2:** Calculator function\n**Level 3:** List comprehension\n**Level 4:** File operations\n**Level 5:** Class with methods',
    JavaScript:
      "**Level 1:** Console.log greeting\n**Level 2:** DOM manipulation\n**Level 3:** Event handling\n**Level 4:** Fetch API\n**Level 5:** React component",
    Java: "**Level 1:** Hello World main method\n**Level 2:** Class with constructor\n**Level 3:** ArrayList operations\n**Level 4:** Exception handling\n**Level 5:** Interface implementation",
    "C++":
      "**Level 1:** iostream Hello World\n**Level 2:** Function with parameters\n**Level 3:** Array processing\n**Level 4:** Pointer operations\n**Level 5:** Class inheritance",
    Rust: "**Level 1:** println! macro\n**Level 2:** Function with ownership\n**Level 3:** Vector operations\n**Level 4:** Error handling\n**Level 5:** Trait implementation",
  };

  return challenges[language] || challenges["Python"];
}

/**
 * Language-specific quiz content
 */
function getLanguageQuizContent(language) {
  const quizzes = {
    Python:
      "**Q1:** List syntax: `[1,2,3]` ✓\n**Q2:** String length: `len()` ✓\n**Q3:** Loop: `for i in range(5)` ✓\n**Q4:** Comment: `# comment` ✓\n**Q5:** Comparison: `==` ✓",
    JavaScript:
      "**Q1:** Best variable: `let/const` ✓\n**Q2:** Select element: `getElementById()` ✓\n**Q3:** Arrow function: `() => {}` ✓\n**Q4:** Event: `addEventListener()` ✓\n**Q5:** Parse JSON: `JSON.parse()` ✓",
    Java: "**Q1:** Class syntax: `public class {}` ✓\n**Q2:** Array: `int[] arr = {};` ✓\n**Q3:** Method: `public void method()` ✓\n**Q4:** Exception: `try-catch` ✓\n**Q5:** Inheritance: `extends` ✓",
    "C++":
      "**Q1:** Include: `#include <iostream>` ✓\n**Q2:** Array: `int arr[] = {};` ✓\n**Q3:** Pointer: `int* ptr` ✓\n**Q4:** Function: `void func()` ✓\n**Q5:** Namespace: `using namespace std` ✓",
    Rust: '**Q1:** Variable: `let name = "";` ✓\n**Q2:** Function: `fn name() {}` ✓\n**Q3:** Vector: `vec![1,2,3]` ✓\n**Q4:** Match: `match value {}` ✓\n**Q5:** Ownership: `move/borrow` ✓',
  };

  return quizzes[language] || quizzes["Python"];
}

/**
 * Show AI notification with type
 */
function showAINotification(message, type = "info", duration = 5000) {
  const container = document.getElementById("ai-notifications");
  if (!container) return;

  const notification = document.createElement("div");
  notification.className = `ai-notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" aria-label="Close notification">×</button>
    </div>
  `;

  container.appendChild(notification);

  // Auto remove
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = "notificationSlide 0.3s ease reverse";
      setTimeout(() => notification.remove(), 300);
    }
  }, duration);

  return notification;
}

/**
 * Update user stats with animation
 */
function updateUserStats(newStats) {
  Object.keys(newStats).forEach((key) => {
    if (userStats.hasOwnProperty(key)) {
      const oldValue = userStats[key];
      userStats[key] = newStats[key];

      // Animate stat change
      const element = document.getElementById(`user-${key}`);
      if (element) {
        element.style.color = "#00ff88";
        element.textContent =
          typeof newStats[key] === "number"
            ? key === "accuracy" || key === "speed"
              ? newStats[key] + (key === "accuracy" ? "%" : "s")
              : newStats[key]
            : newStats[key];

        setTimeout(() => {
          element.style.color = "";
        }, 1000);
      }

      // Update progress bars
      const progressElement = document.getElementById(`${key}-progress`);
      if (progressElement) {
        const maxValues = {
          level: 10,
          xp: 1000,
          streak: 30,
          points: 5000,
          accuracy: 100,
          speed: 60,
          quizScore: 1000,
        };
        const percentage = Math.min(
          (newStats[key] / maxValues[key]) * 100,
          100
        );
        progressElement.style.width = percentage + "%";
      }
    }
  });
}

// ==================== LANGUAGE SELECTION ====================

/**
 * Change programming language with AI assistance
 */
async function selectLanguageWithAI(language) {
  currentLanguage = language;

  // Update editor language
  if (aiEditor) {
    const languageMap = {
      Python: "python",
      JavaScript: "javascript",
      Java: "java",
      "C++": "cpp",
      Rust: "rust",
    };

    const monacoLanguage = languageMap[language] || "python";
    monaco.editor.setModelLanguage(aiEditor.getModel(), monacoLanguage);

    // Set sample code based on language
    const sampleCode = {
      Python:
        '# AI sẽ hướng dẫn bạn Python từ cơ bản\nprint("Xin chào CodeQuest AI!")\n\n# Hãy bắt đầu với biến\nname = "Bạn"\nprint(f"Chào {name}!")',
      JavaScript:
        '// AI sẽ dạy bạn JavaScript hiện đại\nconsole.log("Xin chào CodeQuest AI!");\n\n// Bắt đầu với biến\nconst name = "Bạn";\nconsole.log(`Chào ${name}!`);',
      Java: '// AI sẽ hướng dẫn Java từ cơ bản\npublic class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println("Xin chào CodeQuest AI!");\n        \n        String name = "Bạn";\n        System.out.println("Chào " + name + "!");\n    }\n}',
      "C++":
        '// AI sẽ dạy bạn C++ hiệu quả\n#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    cout << "Xin chào CodeQuest AI!" << endl;\n    \n    string name = "Bạn";\n    cout << "Chào " << name << "!" << endl;\n    return 0;\n}',
      Rust: '// AI sẽ hướng dẫn Rust an toàn\nfn main() {\n    println!("Xin chào CodeQuest AI!");\n    \n    let name = "Bạn";\n    println!("Chào {}!", name);\n}',
    };

    aiEditor.setValue(sampleCode[language] || sampleCode["Python"]);
  }

  // Chỉ log ngôn ngữ thay đổi
  console.log(`Language changed to: ${language}`);

  // Get AI recommendations for the language
  try {
    const prompt = `Tôi vừa chọn học ${language}. Hãy đưa ra 3 lời khuyên ngắn gọn để bắt đầu học ${language} hiệu quả.`;
    const aiResponse = await callAI(prompt, {
      additionalContext: `Focus on beginner tips for ${language}`,
    });

    // Loại bỏ gợi ý tự động để tránh spam
    console.log("AI language recommendations:", aiResponse);
  } catch (error) {
    console.error("Error getting AI language recommendations:", error);
  }
}

// ==================== MODE ACTIVATION ====================

/**
 * Activate different AI modes
 */
function activateAIMode(mode) {
  if (currentMode === mode) return;

  currentMode = mode;

  // Update navigation
  document
    .querySelectorAll(".nav-mode")
    .forEach((btn) => btn.classList.remove("active"));
  const activeBtn = document.querySelector(`[data-mode="${mode}"]`);
  if (activeBtn) activeBtn.classList.add("active");

  // Show corresponding section
  document
    .querySelectorAll(".ai-section")
    .forEach((section) => section.classList.remove("active"));
  const activeSection = document.getElementById(`${mode}-section`);
  if (activeSection) activeSection.classList.add("active");

  // Mode-specific initialization
  switch (mode) {
    case "learning":
      initializeLearningMode();
      break;
    case "practice":
      initializePracticeMode();
      break;
    case "quiz":
      initializeQuizMode();
      break;
    case "analysis":
      initializeAnalysisMode();
      break;
    case "leaderboard":
      initializeLeaderboardMode();
      break;
  }

  // Chỉ log mode change, không thông báo
  console.log(`Mode changed to: ${mode}`);
}

// ==================== LEARNING MODE ====================

function initializeLearningMode() {
  console.log("Learning mode initialized");
  updateTutorStatus("Sẵn sàng dạy bạn!");
}

async function startAILesson(topic) {
  showAINotification(`🤖 AI đang chuẩn bị bài học về ${topic}...`, "info");
  updateTutorStatus("Đang chuẩn bị bài học...");

  try {
    const prompt = `Tạo một bài học về ${topic} cho ${currentLanguage}. Bao gồm: 1) Giới thiệu khái niệm, 2) Ví dụ cụ thể, 3) Bài tập thực hành. Hãy trình bày một cách dễ hiểu và có ví dụ code.`;
    const aiResponse = await callAI(prompt, {
      additionalContext: `Create structured lesson for topic: ${topic}, language: ${currentLanguage}`,
    });

    updateLessonContent(topic, aiResponse);
    updateTutorStatus("Bài học đã sẵn sàng!");

    // Update XP
    updateUserStats({ xp: userStats.xp + 25 });
    showAINotification("🎉 +25 XP cho việc bắt đầu bài học mới!", "success");
  } catch (error) {
    console.error("Error starting AI lesson:", error);
    updateTutorStatus("Có lỗi xảy ra, hãy thử lại!");
  }
}

function updateLessonContent(topic, content) {
  const lessonTitle = document.getElementById("lesson-title");
  const lessonContent = document.getElementById("lesson-content");

  if (lessonTitle) {
    lessonTitle.textContent = `📚 Bài học: ${topic}`;
  }

  if (lessonContent) {
    lessonContent.innerHTML = `
      <div class="ai-lesson-content">
        <div class="lesson-ai-avatar">🤖</div>
        <div class="lesson-text">
          <div class="ai-lesson-response">${content.replace(
            /\n/g,
            "<br>"
          )}</div>
          <div class="lesson-actions">
            <button class="lesson-action-btn" onclick="askAITutor()">❓ Hỏi thêm</button>
            <button class="lesson-action-btn" onclick="getAIExample()">💡 Ví dụ khác</button>
            <button class="lesson-action-btn" onclick="getAIPractice()">🏋️ Bài tập</button>
          </div>
        </div>
      </div>
    `;
  }
}

function updateTutorStatus(status) {
  const tutorStatus = document.querySelector(".tutor-status");
  if (tutorStatus) {
    tutorStatus.textContent = status;
  }
}

async function askAITutor() {
  const question = prompt("🤖 Bạn muốn hỏi AI gì?");
  if (!question) return;

  showAINotification("🤖 AI đang suy nghĩ...", "info");

  try {
    const aiResponse = await callAI(question, {
      additionalContext: `User is asking a question during a lesson. Provide helpful answer in Vietnamese.`,
    });

    showAINotification(`💬 AI trả lời: ${aiResponse}`, "info", 10000);
  } catch (error) {
    console.error("Error asking AI tutor:", error);
  }
}

async function getAIExample() {
  showAINotification("🤖 AI đang tạo ví dụ mới...", "info");

  try {
    const prompt = `Tạo một ví dụ thực tế khác về chủ đề hiện tại bằng ${currentLanguage}. Hãy giải thích từng bước.`;
    const aiResponse = await callAI(prompt);

    showAINotification(`💡 Ví dụ mới: ${aiResponse}`, "info", 12000);
  } catch (error) {
    console.error("Error getting AI example:", error);
  }
}

async function getAIPractice() {
  showAINotification("🤖 AI đang tạo bài tập...", "info");

  try {
    const prompt = `Tạo một bài tập thực hành về chủ đề hiện tại bằng ${currentLanguage}. Bao gồm đề bài và gợi ý làm bài.`;
    const aiResponse = await callAI(prompt);

    showAINotification(`🏋️ Bài tập: ${aiResponse}`, "info", 15000);

    // Add practice XP
    updateUserStats({ xp: userStats.xp + 15 });
  } catch (error) {
    console.error("Error getting AI practice:", error);
  }
}

// ==================== PRACTICE MODE ====================

function initializePracticeMode() {
  console.log("Practice mode initialized");
}

async function generateAIChallenge(difficulty) {
  showAINotification(`🤖 Đang tạo thử thách...`, "info");

  // Tạo challenge đơn giản và ngắn gọn
  const challenges = {
    easy: {
      title: "Tính tổng hai số",
      description: "Viết hàm tính tổng của hai số a và b.",
      example: "Input: a=5, b=3\nOutput: 8",
      hint: "Sử dụng phép cộng đơn giản",
    },
    medium: {
      title: "Tìm số lớn nhất trong mảng",
      description: "Viết hàm tìm số lớn nhất trong một mảng số nguyên.",
      example: "Input: [3, 7, 2, 9, 1]\nOutput: 9",
      hint: "Dùng vòng lặp hoặc hàm max()",
    },
    hard: {
      title: "Kiểm tra số nguyên tố",
      description: "Viết hàm kiểm tra một số có phải số nguyên tố không.",
      example: "Input: 7\nOutput: True",
      hint: "Kiểm tra chia hết từ 2 đến sqrt(n)",
    },
  };

  const challenge = challenges[difficulty];
  displayChallenge(challenge, difficulty);
  showAINotification(`✨ Challenge sẵn sàng!`, "success");
}

function displayChallenge(challenge, difficulty) {
  const challengeDisplay = document.getElementById("challenge-display");
  if (!challengeDisplay) return;

  const difficultyColors = {
    easy: "#00cc66",
    medium: "#ff9900",
    hard: "#ff3366",
  };

  challengeDisplay.innerHTML = `
    <div class="challenge-content">
      <div class="challenge-header">
        <h4>🎯 ${challenge.title}</h4>
        <span class="challenge-difficulty" style="color: ${
          difficultyColors[difficulty]
        }">
          ${difficulty.toUpperCase()}
        </span>
      </div>
      <div class="challenge-description">
        <p><strong>Yêu cầu:</strong> ${challenge.description}</p>
        <div class="example-box">
          <strong>Ví dụ:</strong><br>
          <code>${challenge.example}</code>
        </div>
        <p><strong>Gợi ý:</strong> ${challenge.hint}</p>
      </div>
      <div class="challenge-actions">
        <button class="challenge-btn primary" onclick="startCoding()">🚀 Bắt Đầu Code</button>
        <button class="challenge-btn secondary" onclick="generateAIChallenge('${difficulty}')">🔄 Thử Khác</button>
      </div>
    </div>
  `;
}

function startCoding() {
  console.log("🎯 Starting coding session...");

  if (!aiEditor) {
    console.log("🔄 No editor found, creating one...");
    createFallbackEditor();

    // Wait a moment for editor to be created
    setTimeout(() => {
      if (aiEditor) {
        aiEditor.focus();
        console.log("✅ Editor focused after creation");
      }
    }, 100);
    return;
  }

  try {
    // Chỉ focus vào editor, KHÔNG xóa code hiện tại
    aiEditor.focus();

    // Kiểm tra xem có code chưa, nếu chưa thì mới set template
    const currentCode = aiEditor.getValue ? aiEditor.getValue() : "";

    if (!currentCode || currentCode.trim().length < 5) {
      // Chỉ set template khi editor trống
      if (aiEditor.isFallback) {
        aiEditor.setValue(
          '# Bắt đầu viết code của bạn ở đây\nprint("Hello CodeQuest! 🚀")\n\n# Your code here...'
        );
      } else {
        // Monaco Editor
        aiEditor.setValue(
          '# Bắt đầu viết code của bạn ở đây\nprint("Hello CodeQuest! 🚀")\n\n# Your code here...'
        );
      }

      showAINotification("💡 Template code đã được thêm vào editor!", "info");
    } else {
      showAINotification("✅ Tiếp tục code với nội dung hiện tại!", "success");
    }

    console.log("✅ Coding session started successfully");
  } catch (error) {
    console.error("Error in startCoding:", error);
    // Fallback: just focus the editor
    try {
      aiEditor.focus();
    } catch (focusError) {
      console.error("Could not focus editor:", focusError);
    }
  }
}

async function runCodeWithAI() {
  // Lấy code từ Monaco Editor hoặc fallback editor
  let codeContent = "";

  if (aiEditor && aiEditor.getValue) {
    // Monaco Editor
    codeContent = aiEditor.getValue();
  } else {
    // Fallback editor hoặc textarea
    const codeEditor = document.getElementById("ai-code-editor");
    if (codeEditor) {
      codeContent =
        codeEditor.value ||
        codeEditor.textContent ||
        codeEditor.innerText ||
        "";
    }
  }

  if (!codeContent || codeContent.trim().length < 5) {
    showAINotification(
      "⚠️ Không có code để chạy! Hãy viết code trước.",
      "warning"
    );
    updateAIFeedback("❌ Editor trống! Hãy viết code trong ô editor để test.");
    return;
  }

  showAINotification("▶️ Đang chạy code...", "info");

  setTimeout(() => {
    try {
      // Thực thi code và lấy kết quả
      const result = executeCode(codeContent);

      const feedback = `
        ✅ Code đã chạy thành công!
        
        📋 Code của bạn:
        ${codeContent
          .split("\n")
          .map((line) => `        ${line}`)
          .join("\n")}
        
        📤 Kết quả output:
        ${result.output || "Không có output"}
        
        ${result.error ? `🐛 Có lỗi: ${result.error}` : "✅ Chạy không có lỗi"}
        
        💡 Gợi ý: ${result.suggestion || "Code chạy tốt!"}
      `;

      updateAIFeedback(feedback);
      showAINotification(
        result.error ? "⚠️ Code có lỗi!" : "✅ Code chạy thành công!",
        result.error ? "warning" : "success"
      );

      if (!result.error) {
        updateUserStats({ xp: userStats.xp + 5 });
      }
    } catch (error) {
      const feedback = `
        ❌ Lỗi khi chạy code!
        
        🐛 Chi tiết lỗi: ${error.message}
        
        💡 Hãy kiểm tra lại cú pháp code
      `;
      updateAIFeedback(feedback);
      showAINotification("❌ Code có lỗi!", "warning");
    }
  }, 1000);
}

// Hàm thực thi code thực tế
function executeCode(code) {
  try {
    let output = "";
    let error = null;
    let suggestion = "";

    // Giả lập thực thi code Python đơn giản
    if (code.includes("print(")) {
      // Tìm và thực thi các lệnh print
      const printMatches = code.match(/print\(([^)]+)\)/g);
      if (printMatches) {
        printMatches.forEach((printCmd) => {
          const expression = printCmd.match(/print\(([^)]+)\)/)[1];
          try {
            // Thực thi biểu thức đơn giản
            const result = evaluateExpression(expression, code);
            output += result + "\n";
          } catch (e) {
            output += `Error evaluating: ${expression}\n`;
          }
        });
      }
    } else {
      // Không có print, thử tính kết quả cuối cùng
      const result = evaluateSimpleCode(code);
      if (result !== null) {
        output = `Kết quả: ${result}`;
        suggestion = "Thêm print() để hiển thị kết quả";
      } else {
        output = "Code chạy nhưng không có output";
        suggestion = "Thêm print() để xem kết quả";
      }
    }

    return {
      output: output.trim(),
      error: error,
      suggestion: suggestion,
    };
  } catch (e) {
    return {
      output: "",
      error: e.message,
      suggestion: "Kiểm tra lại cú pháp code",
    };
  }
}

// Đánh giá biểu thức đơn giản
function evaluateExpression(expr, fullCode) {
  // Tìm các biến từ code
  const variables = {};
  const varMatches = fullCode.match(/(\w+)\s*=\s*(\d+)/g);
  if (varMatches) {
    varMatches.forEach((match) => {
      const [, varName, value] = match.match(/(\w+)\s*=\s*(\d+)/);
      variables[varName] = parseInt(value);
    });
  }

  // Thay thế biến bằng giá trị
  let processedExpr = expr.trim();
  for (const [varName, value] of Object.entries(variables)) {
    processedExpr = processedExpr.replace(
      new RegExp(`\\b${varName}\\b`, "g"),
      value
    );
  }

  // Đánh giá biểu thức toán học đơn giản
  if (/^[\d\s+\-*/()]+$/.test(processedExpr)) {
    return eval(processedExpr);
  }

  return processedExpr;
}

// Đánh giá code đơn giản không có print
function evaluateSimpleCode(code) {
  try {
    // Tìm phép tính cuối cùng
    const lines = code.split("\n");
    const lastLine = lines[lines.length - 1].trim();

    if (
      /^[\w\s+\-*/()]+$/.test(lastLine) &&
      (lastLine.includes("+") ||
        lastLine.includes("-") ||
        lastLine.includes("*") ||
        lastLine.includes("/"))
    ) {
      return evaluateExpression(lastLine, code);
    }

    return null;
  } catch (e) {
    return null;
  }
}

function updateAIFeedback(feedback) {
  const feedbackElement = document.getElementById("ai-feedback");
  if (feedbackElement) {
    feedbackElement.innerHTML = `
      <div class="ai-analysis">
        <div class="analysis-header">
          <span class="analysis-icon">🤖</span>
          <span>Phân Tích AI</span>
        </div>
        <div class="analysis-content">
          ${feedback.replace(/\n/g, "<br>")}
        </div>
      </div>
    `;
  }
}

async function submitToAI() {
  // Lấy code từ Monaco Editor hoặc fallback editor
  let codeContent = "";

  if (aiEditor && aiEditor.getValue) {
    // Monaco Editor
    codeContent = aiEditor.getValue();
  } else {
    // Fallback editor hoặc textarea
    const codeEditor = document.getElementById("ai-code-editor");
    if (codeEditor) {
      codeContent =
        codeEditor.value ||
        codeEditor.textContent ||
        codeEditor.innerText ||
        "";
    }
  }

  if (!codeContent || codeContent.trim().length < 5) {
    showAINotification(
      "⚠️ Bạn chưa viết code gì cả! Hãy code trước khi nộp.",
      "warning"
    );
    updateAIFeedback(`
      ❌ Không có code để chấm!
      
      📝 Hướng dẫn:
      • Hãy viết code giải bài toán trong ô editor
      • Code phải có ít nhất 5 ký tự
      • Thử giải quyết challenge ở bên trái
      
      💡 Mẹo: Bắt đầu với hàm đơn giản như def solve():
    `);
    return;
  }

  showAINotification("🤖 AI đang phân tích và chấm điểm...", "info");

  // Gọi AI thực sự để chấm điểm
  try {
    const aiPrompt = `
Bạn là một AI giáo viên chấm bài lập trình. Hãy chấm điểm code sau theo thang điểm 100:

BÀI TẬP: Tính tổng hai số a và b

CODE CỦA HỌC SINH:
\`\`\`
${codeContent}
\`\`\`

HÃY ĐÁNH GIÁ:
1. Code có giải quyết đúng bài toán không? (40 điểm)
2. Cú pháp có chính xác không? (20 điểm) 
3. Code có dễ đọc, gọn gàng không? (20 điểm)
4. Có hiển thị kết quả không? (20 điểm)

Trả về JSON format:
{
  "score": số_điểm_từ_0_đến_100,
  "evaluation": [
    "✅ hoặc ❌ Chi tiết đánh giá từng tiêu chí",
    "..."
  ],
  "comment": "Nhận xét tổng thể ngắn gọn",
  "correct": true/false
}
    `;

    // Gọi AI API
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AI_CONFIG.API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": AI_CONFIG.HEADERS["HTTP-Referer"],
          "X-Title": AI_CONFIG.HEADERS["X-Title"],
        },
        body: JSON.stringify({
          model: AI_CONFIG.MODEL,
          messages: [
            {
              role: "user",
              content: aiPrompt,
            },
          ],
          temperature: 0.3,
        }),
      }
    );

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Parse AI response
    let aiResult;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (e) {
      // Fallback nếu AI không trả về JSON đúng format
      aiResult = {
        score: 70,
        evaluation: ["🤖 AI đã phân tích code của bạn"],
        comment: aiResponse.slice(0, 200) + "...",
        correct: true,
      };
    }

    const score = Math.max(20, Math.min(aiResult.score, 95));
    const feedback_details = aiResult.evaluation || [
      "AI đã đánh giá code của bạn",
    ];
    const solvesProblem = aiResult.correct;

    const feedback = `
      📊 Kết quả AI chấm bài: ${score}/100 điểm
      
      🔍 Chi tiết đánh giá:
      ${feedback_details.map((detail) => `• ${detail}`).join("\n      ")}
      
      💬 Nhận xét AI: ${aiResult.comment || "Code đã được phân tích"}
      
      ${
        score >= 80
          ? "🎉 Xuất sắc! Code hoàn hảo và giải quyết chính xác."
          : score >= 60
          ? "✅ Tốt! Code đúng hướng và có logic rõ ràng."
          : score >= 40
          ? "⚠️ Khá ổn, nhưng cần hoàn thiện để đạt điểm cao hơn."
          : "❌ Code cần sửa lại để giải quyết đúng bài toán."
      }
      
      ${solvesProblem ? "🎯 Bài làm: CHÍNH XÁC" : "⚠️ Bài làm: CẦN CẢI THIỆN"}
    `;

    updateAIFeedback(feedback);
    showAINotification(
      `${score >= 60 ? "✅" : "❌"} AI chấm: ${score}/100`,
      score >= 60 ? "success" : "warning"
    );

    if (score >= 40) {
      const xpGain = Math.floor(score / 3);
      const pointsGain = score * 5;
      updateUserStats({
        xp: userStats.xp + xpGain,
        points: userStats.points + pointsGain,
      });

      showAINotification(`🎉 +${xpGain} XP, +${pointsGain} Points!`, "success");
    }
  } catch (error) {
    console.error("AI grading error:", error);
    showAINotification("❌ Lỗi kết nối AI, thử lại sau", "error");

    // Fallback scoring khi AI lỗi
    let fallbackScore = 50;
    if (
      codeContent.includes("a") &&
      codeContent.includes("b") &&
      codeContent.includes("+")
    ) {
      fallbackScore = 75;
    }

    const fallbackFeedback = `
      📊 Kết quả tạm thời: ${fallbackScore}/100 điểm
      ⚠️ AI hiện không khả dụng, đây là đánh giá cơ bản
      🔄 Hãy thử lại để được AI chấm điểm chính xác
    `;

    updateAIFeedback(fallbackFeedback);
  }
}

function showSubmissionResult(score, feedback) {
  const modal = document.createElement("div");
  modal.className = "ai-modal";
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>🎯 Kết Quả AI Chấm Bài</h3>
        <button onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="modal-body">
        <div class="score-display">
          <div class="score-circle" style="background: conic-gradient(#00ff88 ${
            score * 3.6
          }deg, #2a2a2a 0deg)">
            <span class="score-number">${score}</span>
            <span class="score-label">điểm</span>
          </div>
        </div>
        <div class="ai-feedback">
          ${feedback.replace(/\n/g, "<br>")}
        </div>
      </div>
      <div class="modal-actions">
        <button onclick="this.parentElement.parentElement.parentElement.remove()">Đóng</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Auto remove after 15 seconds
  setTimeout(() => {
    if (modal.parentElement) modal.remove();
  }, 15000);
}

async function getAIHelp() {
  console.log("💡 Getting AI help...");

  // Check if editor exists
  if (!aiEditor) {
    console.log("⚠️ No editor found for AI help");
    showAINotification("⚠️ Editor chưa sẵn sàng. Hãy thử lại!", "warning");
    return;
  }

  showAINotification("🤖 AI đang chuẩn bị trợ giúp...", "info");

  const code = aiEditor.getValue() || "";
  console.log("Code for AI help:", code.length, "characters");

  try {
    const prompt = code.trim()
      ? `Tôi đang gặp khó khăn với đoạn code này: \n\n${code}\n\nHãy đưa ra gợi ý để cải thiện hoặc sửa lỗi.`
      : `Tôi cần trợ giúp để bắt đầu viết code ${currentLanguage}. Hãy đưa ra hướng dẫn từng bước và ví dụ cơ bản.`;

    const aiResponse = await callAI(prompt);

    if (aiResponse && aiResponse.length > 0) {
      showAINotification(`🆘 AI trợ giúp: ${aiResponse}`, "info", 15000);
      console.log("✅ AI help provided successfully");
    } else {
      showAINotification(
        "⚠️ AI không thể trợ giúp lúc này. Hãy thử lại sau!",
        "warning"
      );
    }
  } catch (error) {
    console.error("Error getting AI help:", error);
    showAINotification(
      "❌ Có lỗi khi liên hệ AI. Hãy kiểm tra kết nối!",
      "warning"
    );
  }
}

// ==================== QUIZ MODE ====================

function initializeQuizMode() {
  console.log("Quiz mode initialized");
}

let currentQuiz = null;
let quizStartTime = null;

async function startAIQuiz() {
  showAINotification("🤖 AI đang tạo quiz cá nhân hóa...", "info");

  try {
    const prompt = `Tạo một bộ quiz 5 câu hỏi về ${currentLanguage} với độ khó phù hợp với level ${userStats.level}. Mỗi câu hỏi có 4 đáp án A, B, C, D và chỉ rõ đáp án đúng. Format: Câu X: [Nội dung câu hỏi] | A) ... | B) ... | C) ... | D) ... | Đáp án: [A/B/C/D]`;

    const aiResponse = await callAI(prompt, {
      additionalContext: `Generate ${currentLanguage} quiz for level ${userStats.level}`,
    });

    parseAndStartQuiz(aiResponse);
  } catch (error) {
    console.error("Error starting AI quiz:", error);
    showAINotification("❌ Có lỗi khi tạo quiz!", "warning");
  }
}

function parseAndStartQuiz(quizContent) {
  // Simple parsing (in real app, would be more robust)
  const questions = quizContent.split(/Câu \d+:/).slice(1);

  if (questions.length === 0) {
    showAINotification("❌ Không thể tạo quiz. Hãy thử lại!", "warning");
    return;
  }

  currentQuiz = {
    questions: questions.map((q, index) => {
      const parts = q.split("|");
      const questionText = parts[0]?.trim();
      const options = parts.slice(1, 5).map((opt) => opt?.trim().substring(3));
      const answerPart = parts[5] || "";
      const correctAnswer = answerPart.match(/([ABCD])/)?.[1] || "A";

      return {
        id: index + 1,
        question: questionText || `Câu hỏi ${index + 1}`,
        options:
          options.length === 4
            ? options
            : ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
        correct: correctAnswer,
        userAnswer: null,
      };
    }),
    currentIndex: 0,
    score: 0,
    startTime: Date.now(),
  };

  displayQuizQuestion();
  showAINotification("🎯 Quiz đã bắt đầu! Chúc bạn may mắn!", "success");
}

function displayQuizQuestion() {
  const quizPanel = document.getElementById("quiz-panel");
  if (!quizPanel || !currentQuiz) return;

  const question = currentQuiz.questions[currentQuiz.currentIndex];
  const progress =
    ((currentQuiz.currentIndex + 1) / currentQuiz.questions.length) * 100;

  quizPanel.innerHTML = `
    <div class="quiz-active">
      <div class="quiz-progress">
        <div class="progress-bar" style="width: ${progress}%"></div>
        <span class="progress-text">Câu ${currentQuiz.currentIndex + 1}/${
    currentQuiz.questions.length
  }</span>
      </div>
      
      <div class="quiz-question">
        <h3>${question.question}</h3>
      </div>
      
      <div class="quiz-options">
        ${question.options
          .map(
            (option, index) => `
          <button class="quiz-option" onclick="selectQuizAnswer('${String.fromCharCode(
            65 + index
          )}')">
            <span class="option-letter">${String.fromCharCode(
              65 + index
            )}</span>
            <span class="option-text">${option}</span>
          </button>
        `
          )
          .join("")}
      </div>
      
      <div class="quiz-timer" id="quiz-timer">
        <span>⏱️ Thời gian: <span id="timer-display">00:00</span></span>
      </div>
    </div>
  `;

  // Start timer
  updateQuizTimer();
}

function selectQuizAnswer(answer) {
  if (!currentQuiz) return;

  const question = currentQuiz.questions[currentQuiz.currentIndex];
  question.userAnswer = answer;

  // Highlight selected answer
  document
    .querySelectorAll(".quiz-option")
    .forEach((btn) => btn.classList.remove("selected"));
  event.target.closest(".quiz-option").classList.add("selected");

  // Auto advance after 1 second
  setTimeout(() => {
    nextQuizQuestion();
  }, 1000);
}

function nextQuizQuestion() {
  if (!currentQuiz) return;

  const question = currentQuiz.questions[currentQuiz.currentIndex];

  // Check answer
  if (question.userAnswer === question.correct) {
    currentQuiz.score++;
    showAINotification("✅ Đúng rồi!", "success", 2000);
  } else {
    showAINotification(
      `❌ Sai rồi! Đáp án đúng là ${question.correct}`,
      "warning",
      3000
    );
  }

  currentQuiz.currentIndex++;

  if (currentQuiz.currentIndex < currentQuiz.questions.length) {
    displayQuizQuestion();
  } else {
    finishQuiz();
  }
}

function finishQuiz() {
  if (!currentQuiz) return;

  const totalTime = Math.floor((Date.now() - currentQuiz.startTime) / 1000);
  const accuracy = (currentQuiz.score / currentQuiz.questions.length) * 100;
  const avgTime = totalTime / currentQuiz.questions.length;

  // Update stats
  updateUserStats({
    accuracy: Math.round(accuracy),
    speed: avgTime,
    quizScore: currentQuiz.score * 100,
    xp: userStats.xp + currentQuiz.score * 20,
    points: userStats.points + currentQuiz.score * 50,
  });

  // Display results
  const quizPanel = document.getElementById("quiz-panel");
  if (quizPanel) {
    quizPanel.innerHTML = `
      <div class="quiz-results">
        <div class="results-header">
          <h3>🎉 Kết Quả Quiz</h3>
        </div>
        
        <div class="results-stats">
          <div class="result-stat">
            <div class="stat-icon">🎯</div>
            <div class="stat-value">${accuracy}%</div>
            <div class="stat-label">Độ chính xác</div>
          </div>
          <div class="result-stat">
            <div class="stat-icon">⚡</div>
            <div class="stat-value">${avgTime}s</div>
            <div class="stat-label">Thời gian/câu</div>
          </div>
          <div class="result-stat">
            <div class="stat-icon">🏆</div>
            <div class="stat-value">${currentQuiz.score}/${currentQuiz.questions.length}</div>
            <div class="stat-label">Câu đúng</div>
          </div>
        </div>
        
        <div class="results-actions">
          <button class="quiz-action-btn" onclick="startAIQuiz()">🔄 Quiz Mới</button>
          <button class="quiz-action-btn" onclick="getQuizAnalysis()">📊 Phân Tích</button>
        </div>
      </div>
    `;
  }

  showAINotification(
    `🎉 Hoàn thành quiz! ${currentQuiz.score}/${currentQuiz.questions.length} câu đúng!`,
    "success"
  );
  currentQuiz = null;
}

function updateQuizTimer() {
  if (!currentQuiz) return;

  const timerDisplay = document.getElementById("timer-display");
  if (!timerDisplay) return;

  const elapsed = Math.floor((Date.now() - currentQuiz.startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  timerDisplay.textContent = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  setTimeout(updateQuizTimer, 1000);
}

async function getQuizAnalysis() {
  showAINotification("🤖 AI đang phân tích kết quả quiz...", "info");

  try {
    const prompt = `Phân tích kết quả quiz: ${userStats.accuracy}% độ chính xác, ${userStats.speed}s/câu, ${userStats.quizScore} điểm. Đưa ra lời khuyên cải thiện cho ${currentLanguage}.`;
    const aiResponse = await callAI(prompt);

    showAINotification(`📊 Phân tích AI: ${aiResponse}`, "info", 10000);
  } catch (error) {
    console.error("Error getting quiz analysis:", error);
  }
}

// ==================== ANALYSIS MODE ====================

function initializeAnalysisMode() {
  console.log("Analysis mode initialized");
  updateLearningPath();
  generateAIInsights();
}

function updateLearningPath() {
  // This would normally be dynamic based on user progress
  console.log("Learning path updated");
}

async function generateAIInsights() {
  try {
    const prompt = `Dựa trên stats của user: Level ${userStats.level}, ${userStats.xp} XP, ${userStats.streak} ngày streak, độ chính xác ${userStats.accuracy}%. Phân tích điểm mạnh, điểm cần cải thiện và đề xuất học tập cho ${currentLanguage}.`;

    const aiResponse = await callAI(prompt, {
      additionalContext:
        "Provide structured analysis with strengths, improvements needed, and recommendations",
    });

    // Parse and display insights (simplified)
    console.log("AI Insights generated:", aiResponse);
  } catch (error) {
    console.error("Error generating AI insights:", error);
  }
}

// ==================== LEADERBOARD MODE ====================

function initializeLeaderboardMode() {
  console.log("Leaderboard mode initialized");
  loadLeaderboard();
}

function loadLeaderboard() {
  // Simulate leaderboard data
  const mockLeaderboard = [
    {
      rank: 4,
      name: "CodeWarrior",
      points: userStats.points,
      level: userStats.level,
      progress: "Bạn",
    },
    { rank: 5, name: "PythonPro", points: 2200, level: 3, progress: "85%" },
    { rank: 6, name: "JSNinja", points: 1950, level: 2, progress: "78%" },
    { rank: 7, name: "CppMaster", points: 1800, level: 2, progress: "65%" },
    { rank: 8, name: "RustRover", points: 1650, level: 2, progress: "55%" },
  ];

  const rankingList = document.getElementById("ranking-list");
  if (rankingList) {
    rankingList.innerHTML = mockLeaderboard
      .map(
        (user) => `
      <div class="ranking-row ${user.progress === "Bạn" ? "user-row" : ""}">
        <span class="rank">#${user.rank}</span>
        <span class="name">${user.name}</span>
        <span class="points">${user.points}</span>
        <span class="level">Level ${user.level}</span>
        <span class="progress">${user.progress}</span>
      </div>
    `
      )
      .join("");
  }
}

function filterRanking(type) {
  // Update filter buttons
  document
    .querySelectorAll(".filter-btn")
    .forEach((btn) => btn.classList.remove("active"));
  event.target.classList.add("active");

  showAINotification(
    `📊 Đã chuyển sang bảng xếp hạng ${
      type === "all" ? "tổng thể" : type === "weekly" ? "tuần" : "tháng"
    }`,
    "info"
  );

  // Reload leaderboard with filter
  loadLeaderboard();
}

// ==================== AI ASSISTANT ====================

function toggleAIAssistant() {
  const panel = document.getElementById("assistant-panel");
  if (panel) {
    panel.classList.toggle("active");

    if (panel.classList.contains("active")) {
      showAINotification(
        "🤖 AI Assistant đã sẵn sàng hỗ trợ bạn!",
        "info",
        3000
      );
    }
  }
}

function closeAIAssistant() {
  const panel = document.getElementById("assistant-panel");
  if (panel) {
    panel.classList.remove("active");
  }
}

async function sendToAI() {
  const input = document.getElementById("ai-input");
  const chat = document.getElementById("assistant-chat");

  if (!input || !chat || !input.value.trim()) return;

  const userMessage = input.value.trim();

  // Add user message
  chat.innerHTML += `
    <div class="chat-message user-message">
      <span>${userMessage}</span>
    </div>
  `;

  input.value = "";
  chat.scrollTop = chat.scrollHeight;

  // Show typing indicator
  chat.innerHTML += `
    <div class="chat-message ai-message typing" id="typing-indicator">
      <span>🤖 AI đang suy nghĩ...</span>
    </div>
  `;
  chat.scrollTop = chat.scrollHeight;

  try {
    const aiResponse = await callAI(userMessage, {
      additionalContext:
        "User is chatting with AI assistant. Be helpful and friendly.",
    });

    // Remove typing indicator
    const typingIndicator = document.getElementById("typing-indicator");
    if (typingIndicator) typingIndicator.remove();

    // Add AI response
    chat.innerHTML += `
      <div class="chat-message ai-message">
        <span>🤖 ${aiResponse}</span>
      </div>
    `;

    chat.scrollTop = chat.scrollHeight;
  } catch (error) {
    console.error("Error sending to AI:", error);

    // Remove typing indicator
    const typingIndicator = document.getElementById("typing-indicator");
    if (typingIndicator) typingIndicator.remove();

    chat.innerHTML += `
      <div class="chat-message ai-message error">
        <span>🤖 Xin lỗi, tôi gặp lỗi kỹ thuật. Hãy thử lại sau!</span>
      </div>
    `;
  }
}

// Allow Enter key to send message
document.addEventListener("DOMContentLoaded", function () {
  const aiInput = document.getElementById("ai-input");
  if (aiInput) {
    aiInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        sendToAI();
      }
    });
  }
});

// ==================== VOICE CONTROL ====================

let isVoiceActive = false;

function toggleAIVoice() {
  isVoiceActive = !isVoiceActive;
  const voiceBtn = document.querySelector(".voice-btn");

  if (isVoiceActive) {
    voiceBtn.style.background = "#ff3366";
    voiceBtn.textContent = "🔴";
    showAINotification("🎤 Điều khiển giọng nói đã bật", "info");
    startVoiceRecognition();
  } else {
    voiceBtn.style.background = "#00ff88";
    voiceBtn.textContent = "🎤";
    showAINotification("🎤 Điều khiển giọng nói đã tắt", "info");
    stopVoiceRecognition();
  }
}

function startVoiceRecognition() {
  if (!("webkitSpeechRecognition" in window)) {
    showAINotification(
      "❌ Trình duyệt không hỗ trợ nhận diện giọng nói",
      "warning"
    );
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = "vi-VN";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = function (event) {
    const transcript = event.results[event.results.length - 1][0].transcript;

    if (transcript.includes("AI")) {
      processVoiceCommand(transcript);
    }
  };

  recognition.onerror = function () {
    showAINotification("❌ Lỗi nhận diện giọng nói", "warning");
  };

  recognition.start();
  window.currentRecognition = recognition;
}

function stopVoiceRecognition() {
  if (window.currentRecognition) {
    window.currentRecognition.stop();
    window.currentRecognition = null;
  }
}

function processVoiceCommand(command) {
  const lowerCommand = command.toLowerCase();

  if (lowerCommand.includes("học")) {
    activateAIMode("learning");
  } else if (
    lowerCommand.includes("luyện tập") ||
    lowerCommand.includes("thách đấu")
  ) {
    activateAIMode("practice");
  } else if (
    lowerCommand.includes("quiz") ||
    lowerCommand.includes("kiểm tra")
  ) {
    activateAIMode("quiz");
  } else if (lowerCommand.includes("phân tích")) {
    activateAIMode("analysis");
  } else if (lowerCommand.includes("xếp hạng")) {
    activateAIMode("leaderboard");
  } else {
    showAINotification(`🎤 Lệnh giọng nói: "${command}"`, "info");
  }
}

// ==================== ADVANCED AI FEATURES ====================

// Code Analysis with Real-time Feedback
function analyzeCodeWithAI() {
  if (!aiEditor) return;

  const code = aiEditor.getValue();
  if (!code.trim()) return;

  // Real-time analysis (debounced)
  clearTimeout(window.analysisTimeout);
  window.analysisTimeout = setTimeout(async () => {
    try {
      const prompt = `Phân tích nhanh code ${currentLanguage}: ${code}. Chỉ đưa ra 1-2 gợi ý ngắn gọn nhất.`;
      const feedback = await callAI(prompt);
      updateAIFeedback(`💡 ${feedback}`);
    } catch (error) {
      console.error("Real-time analysis error:", error);
    }
  }, 2000);
}

// Personalized Learning Recommendations
async function getPersonalizedHelp() {
  showAINotification("🤖 AI đang phân tích và tạo trợ giúp cá nhân...", "info");

  try {
    const prompt = `Dựa trên level ${userStats.level}, streak ${userStats.streak}, accuracy ${userStats.accuracy}% của user học ${currentLanguage}. Đưa ra 3 gợi ý học tập cá nhân hóa cụ thể.`;
    const aiResponse = await callAI(prompt);

    showAINotification(`🎯 Gợi ý cá nhân: ${aiResponse}`, "info", 12000);
  } catch (error) {
    console.error("Error getting personalized help:", error);
  }
}

// AI Explanation Toggle
let isExplanationMode = false;

function toggleAIExplanation() {
  isExplanationMode = !isExplanationMode;
  const btn = event.target;

  if (isExplanationMode) {
    btn.textContent = "🔊 Đang Giải Thích";
    btn.style.background = "#ff9900";
    showAINotification(
      "🔊 Chế độ giải thích AI đã bật - AI sẽ giải thích chi tiết",
      "info"
    );
  } else {
    btn.textContent = "🔊 AI Giải Thích";
    btn.style.background = "";
    showAINotification("🔊 Chế độ giải thích AI đã tắt", "info");
  }
}

// ==================== AI CONNECTION TESTING ====================

/**
 * Auto-detect working OpenRouter model
 */
async function autoDetectWorkingModel() {
  const modelsToTry = AI_CONFIG.AVAILABLE_MODELS;

  console.log("🔍 Auto-detecting working OpenRouter model...");

  for (const model of modelsToTry) {
    try {
      console.log(`🧪 Testing model: ${model}`);

      const response = await fetch(AI_CONFIG.ENDPOINTS.chat, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AI_CONFIG.API_KEY}`,
          "HTTP-Referer": AI_CONFIG.HEADERS["HTTP-Referer"],
          "X-Title": AI_CONFIG.HEADERS["X-Title"],
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: "Hi" }],
          max_tokens: 10,
        }),
      });

      if (response.ok) {
        console.log(`✅ Model ${model} works!`);
        AI_CONFIG.MODEL = model;
        return model;
      } else {
        const errorText = await response.text();
        console.log(
          `❌ Model ${model} failed with status:`,
          response.status,
          errorText.substring(0, 100)
        );
      }
    } catch (error) {
      console.log(`❌ Model ${model} error:`, error.message);
    }
  }

  return null;
}

/**
 * Test OpenRouter AI connection with comprehensive model detection
 */
async function testAIConnection() {
  console.log(
    "🔍 Testing OpenRouter connection with API key:",
    AI_CONFIG.API_KEY.substring(0, 15) + "..."
  );
  updateTutorStatus("Đang kiểm tra API...");

  try {
    // First, try to get available models and test them
    const workingAPI = await testAPIVersions();

    if (!workingAPI) {
      // Fallback to direct model testing
      console.log("🔄 Fallback to direct model testing...");
      const workingModel = await autoDetectWorkingModel();

      if (!workingModel) {
        throw new Error("Không tìm thấy model OpenRouter nào hoạt động");
      }
    }

    console.log("✅ OpenRouter API working");
    updateTutorStatus("Đang test model...");

    // Test with actual Vietnamese content
    const testPrompt =
      'Xin chào! Hãy trả lời ngắn gọn bằng tiếng Việt: "Tôi là AI của CodeQuest, sẵn sàng giúp bạn học lập trình!"';
    console.log("📤 Testing with Vietnamese prompt:", testPrompt);

    const testResponse = await generateText(testPrompt);

    console.log("📥 Final test response:", {
      hasResponse: !!testResponse,
      length: testResponse?.length,
      content: testResponse?.substring(0, 200),
      isOfflineContent: testResponse?.includes("[OFFLINE MODE]"),
      model: AI_CONFIG.MODEL,
    });

    // Check if we got real AI response or offline fallback
    if (
      testResponse &&
      testResponse.length > 0 &&
      !testResponse.includes("[OFFLINE MODE]")
    ) {
      console.log("✅ Real OpenRouter AI connection successful!");
      showAINotification(`✅ API hoạt động tốt!`, "success", 5000);
      updateTutorStatus(`AI sẵn sàng! ${AI_CONFIG.MODEL} 🤖✨`);
      return true;
    } else {
      throw new Error(
        "Chỉ nhận được offline content - OpenRouter API có vấn đề"
      );
    }
  } catch (error) {
    console.error("❌ OpenRouter connection test failed:", error);
    showAINotification(`❌ API không hoạt động`, "warning", 5000);
    updateTutorStatus("OpenRouter không khả dụng - Offline mode");
    return false;
  }
}

/**
 * Quick AI functionality demo
 */
async function demoAIFeatures() {
  if (!(await testAIConnection())) {
    return;
  }

  // Demo different AI features
  setTimeout(async () => {
    console.log("🎯 Demo: Creating Python challenge...");
    try {
      const challenge = await generateText(
        `Tạo một thử thách Python đơn giản: viết hàm tính giai thừa. Bao gồm mô tả và ví dụ input/output.`
      );
      console.log("Demo challenge:", challenge);
      console.log("✨ Demo successful! AI can create coding challenges.");
    } catch (error) {
      console.error("Demo failed:", error);
    }
  }, 3000);
}

/**
 * Test OpenRouter models and get available models list
 */
async function testAPIVersions() {
  console.log("🔍 Testing OpenRouter models...");

  try {
    // First, get available models from OpenRouter
    console.log("🧪 Fetching available models from OpenRouter...");

    const modelsResponse = await fetch(AI_CONFIG.ENDPOINTS.models, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${AI_CONFIG.API_KEY}`,
        "HTTP-Referer": AI_CONFIG.HEADERS["HTTP-Referer"],
        "X-Title": AI_CONFIG.HEADERS["X-Title"],
      },
    });

    if (modelsResponse.ok) {
      const modelsData = await modelsResponse.json();
      const availableModels = modelsData.data?.map((m) => m.id) || [];
      console.log("✅ Available models:", availableModels.slice(0, 10)); // Log first 10

      // Update available models list with working ones
      const workingModels = AI_CONFIG.AVAILABLE_MODELS.filter((model) =>
        availableModels.includes(model)
      );

      if (workingModels.length > 0) {
        AI_CONFIG.AVAILABLE_MODELS = workingModels;
        console.log(`✅ Found ${workingModels.length} available models`);
        return { provider: "openrouter", models: workingModels };
      }
    }

    // Fallback: test our predefined models
    for (const model of AI_CONFIG.AVAILABLE_MODELS) {
      try {
        console.log(`Testing model: ${model}`);

        const response = await fetch(AI_CONFIG.ENDPOINTS.chat, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${AI_CONFIG.API_KEY}`,
            "HTTP-Referer": AI_CONFIG.HEADERS["HTTP-Referer"],
            "X-Title": AI_CONFIG.HEADERS["X-Title"],
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: "Test" }],
            max_tokens: 5,
          }),
        });

        if (response.ok) {
          console.log(`✅ SUCCESS: ${model} works!`);
          AI_CONFIG.MODEL = model;
          return { provider: "openrouter", model: model };
        } else {
          const errorText = await response.text();
          console.log(
            `❌ ${model} failed:`,
            response.status,
            errorText.substring(0, 100)
          );
        }
      } catch (error) {
        console.log(`❌ ${model} error:`, error.message);
      }
    }
  } catch (error) {
    console.error("❌ Error testing OpenRouter:", error);
  }

  console.log("❌ No working models found");
  return null;
}

/**
 * Switch AI model dynamically
 */
async function switchAIModel(newModel) {
  if (!AI_CONFIG.AVAILABLE_MODELS.includes(newModel)) {
    console.log(`❌ Model ${newModel} not available`);
    return false;
  }

  const oldModel = AI_CONFIG.MODEL;
  AI_CONFIG.MODEL = newModel;

  console.log(`Switching from ${oldModel} to ${newModel}...`);

  try {
    // Test new model
    const testResponse = await generateText("Test connection");

    if (testResponse && !testResponse.includes("[OFFLINE MODE]")) {
      console.log(`Successfully switched to ${newModel}`);
      updateTutorStatus(`AI sẵn sàng! ${newModel} 🤖✨`);
      return true;
    } else {
      throw new Error("Model test failed");
    }
  } catch (error) {
    // Rollback to old model
    AI_CONFIG.MODEL = oldModel;
    console.log(`Cannot switch to ${newModel}. Rolled back to ${oldModel}.`);
    return false;
  }
}

/**
 * Get model performance info
 */
function getModelInfo(modelName = AI_CONFIG.MODEL) {
  const modelInfoMap = {
    "openai/gpt-4o": { speed: "⚡⚡⚡", quality: "🌟🌟🌟🌟🌟", cost: "💰💰💰" },
    "openai/gpt-4o-mini": {
      speed: "⚡⚡⚡⚡",
      quality: "🌟🌟🌟🌟",
      cost: "💰",
    },
    "google/gemini-2.0-flash-exp:free": {
      speed: "⚡⚡⚡⚡⚡",
      quality: "🌟🌟🌟🌟",
      cost: "🆓",
    },
    "google/gemini-pro": { speed: "⚡⚡⚡", quality: "🌟🌟🌟🌟", cost: "💰💰" },
    "anthropic/claude-3-haiku": {
      speed: "⚡⚡⚡⚡",
      quality: "🌟🌟🌟",
      cost: "💰",
    },
    "meta-llama/llama-3.1-8b-instruct:free": {
      speed: "⚡⚡⚡",
      quality: "🌟🌟🌟",
      cost: "🆓",
    },
  };

  return (
    modelInfoMap[modelName] || { speed: "⚡⚡", quality: "🌟🌟🌟", cost: "💰" }
  );
}

/**
 * Enhanced manual AI test with model switching
 */
async function manualTestAI() {
  console.log("🧪 Starting manual OpenRouter AI test...");

  try {
    const testPrompt =
      'Hãy trả lời ngắn gọn: "Tôi là AI trợ lý của CodeQuest, sẵn sàng giúp bạn!" bằng tiếng Việt.';
    console.log("🧪 Manual test prompt:", testPrompt);
    console.log("🧪 Current model:", AI_CONFIG.MODEL);

    const response = await generateText(testPrompt);

    console.log("🧪 Manual test response:", response);

    if (response.includes("[OFFLINE MODE]") || response.includes("offline")) {
      console.log("❌ Manual test failed: Received offline content");

      // Try alternative model
      const altModels = AI_CONFIG.AVAILABLE_MODELS.filter(
        (m) => m !== AI_CONFIG.MODEL
      );
      if (altModels.length > 0) {
        console.log(`🔄 Trying alternative model: ${altModels[0]}...`);
        await switchAIModel(altModels[0]);
      }
    } else {
      const modelInfo = getModelInfo();
      console.log(
        `✅ Manual test successful! Model: ${AI_CONFIG.MODEL} - Response: "${response}"`
      );
    }
  } catch (error) {
    console.error("Manual test error:", error);
  }
}

// ==================== INITIALIZATION ====================

/**
 * Initialize the entire AI dashboard
 */
function initializeAIDashboard() {
  console.log("🤖 Initializing AI Dashboard...");

  // Load user stats first
  loadUserStats();

  // Initialize Editor with guaranteed fallback
  initializeMonacoEditor()
    .then(() => {
      console.log("✅ Editor initialization completed!");
      finishInitialization();
    })
    .catch((error) => {
      console.log(
        "⚠️ Editor initialization had issues, but continuing:",
        error.message
      );
      // Ensure we have some kind of editor
      if (!window.aiEditor) {
        createFallbackEditor();
      }
      finishInitialization();
    });

  function finishInitialization() {
    // Set default mode
    activateAIMode("learning");

    // Create visual effects
    createMatrixEffect();
    startAIAnimations();

    // Test AI connection
    setTimeout(() => {
      testAIConnection();
    }, 500);

    console.log("✅ Dashboard initialization complete!");
  }

  console.log("✅ AI Dashboard initialized successfully");
}

/**
 * Initialize Monaco Editor with AI enhancements
 */
function initializeMonacoEditor() {
  return new Promise((resolve, reject) => {
    console.log("🔄 Initializing Editor...");

    // Try Monaco first, but with quick timeout
    const monacoTimeout = setTimeout(() => {
      console.log("⚠️ Monaco Editor timeout, using fallback");
      createFallbackEditor();
      resolve();
    }, 3000); // 3 second timeout

    // Check if Monaco is already available
    if (typeof monaco !== "undefined") {
      clearTimeout(monacoTimeout);
      console.log("✅ Monaco already available");
      setupEditor();
      resolve();
      return;
    }

    // Check if require is available
    if (typeof require === "undefined") {
      clearTimeout(monacoTimeout);
      console.log("⚠️ require.js not available, using fallback immediately");
      createFallbackEditor();
      resolve();
      return;
    }

    console.log("🔄 Attempting to load Monaco Editor...");

    try {
      // Quick Monaco setup
      require.config({
        paths: {
          vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs",
        },
      });

      require(["vs/editor/editor.main"], function () {
        clearTimeout(monacoTimeout);
        console.log("✅ Monaco Editor loaded");
        setupEditor();
        resolve();
      }, function (error) {
        clearTimeout(monacoTimeout);
        console.log("⚠️ Monaco failed, using fallback:", error.message);
        createFallbackEditor();
        resolve();
      });
    } catch (error) {
      clearTimeout(monacoTimeout);
      console.log("⚠️ Monaco setup failed, using fallback:", error.message);
      createFallbackEditor();
      resolve();
    }

    function setupEditor() {
      console.log("🔧 Setting up Monaco Editor...");
      const editorContainer = document.getElementById("ai-code-editor");

      if (!editorContainer) {
        console.error("❌ Editor container #ai-code-editor not found");
        reject(new Error("Editor container not found"));
        return;
      }

      console.log("✅ Editor container found, creating editor instance...");

      try {
        window.aiEditor = monaco.editor.create(editorContainer, {
          value:
            '# AI sẽ hướng dẫn bạn viết code ở đây\nprint("Xin chào CodeQuest AI!")\n\n# Bắt đầu viết code của bạn...',
          language: "python",
          theme: "vs-dark",
          automaticLayout: true,
          fontSize: 14,
          fontFamily: "JetBrains Mono, monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          lineNumbers: "on",
          roundedSelection: false,
          scrollbar: {
            vertical: "visible",
            horizontal: "visible",
          },
          selectOnLineNumbers: true,
        });

        console.log("✅ Monaco Editor instance created successfully");

        // Add custom key bindings
        try {
          window.aiEditor.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyA,
            function () {
              console.log("🔧 Custom Ctrl+A triggered");
              // Custom Ctrl+A handler - select all and prepare for replacement
              const model = window.aiEditor.getModel();
              if (model) {
                window.aiEditor.setSelection(model.getFullModelRange());
                // Don't auto-delete, let user decide what to do with selection
              }
            }
          );
          console.log("✅ Custom key bindings added");
        } catch (keyError) {
          console.warn("⚠️ Could not add key bindings:", keyError);
        }

        // AI Real-time feedback (throttled)
        let analysisTimeout;
        window.aiEditor.onDidChangeModelContent(() => {
          clearTimeout(analysisTimeout);
          analysisTimeout = setTimeout(() => {
            analyzeCodeWithAI();
          }, 1000); // Wait 1 second after user stops typing
        });

        console.log("✅ Monaco Editor fully initialized with AI features");

        // Mark editor as ready
        window.aiEditor.isReady = true;
      } catch (error) {
        console.error("❌ Error creating Monaco Editor:", error);
        reject(error);
      }
    }
  });
}

/**
 * Analyze code with AI (throttled)
 */
let lastAnalysisTime = 0;
async function analyzeCodeWithAI() {
  if (!aiEditor) return;

  const now = Date.now();
  if (now - lastAnalysisTime < 2000) return; // Throttle to every 2 seconds
  lastAnalysisTime = now;

  const code = aiEditor.getValue();
  if (!code || code.trim().length < 10) return; // Skip very short code

  try {
    // Simple syntax highlighting hints only (no API calls for real-time)
    const lines = code.split("\n");
    let hasErrors = false;

    lines.forEach((line, index) => {
      // Basic Python syntax checks
      if (currentLanguage === "python") {
        if (line.includes("print(") && !line.includes(")")) {
          hasErrors = true;
        }
        if (line.match(/^\s*if\s+.*[^:]$/)) {
          hasErrors = true;
        }
      }
    });

    // Update status quietly
    if (hasErrors) {
      updateTutorStatus("Có lỗi syntax ở code...");
    } else {
      updateTutorStatus("Code trông ổn!");
    }
  } catch (error) {
    console.error("Code analysis error:", error);
  }
}

/**
 * Create matrix rain effect
 */
function createMatrixEffect() {
  const matrixContainer = document.querySelector(".matrix-rain");
  if (!matrixContainer) return;

  const characters =
    "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";

  // Clear existing content
  matrixContainer.innerHTML = "";

  for (let i = 0; i < 50; i++) {
    const column = document.createElement("div");
    column.className = "matrix-column";
    column.style.left = Math.random() * 100 + "%";
    column.style.animationDelay = Math.random() * 5 + "s";
    column.style.animationDuration = Math.random() * 3 + 2 + "s";

    for (let j = 0; j < 20; j++) {
      const char = document.createElement("span");
      char.textContent =
        characters[Math.floor(Math.random() * characters.length)];
      char.style.opacity = Math.random();
      column.appendChild(char);
    }

    matrixContainer.appendChild(column);
  }

  console.log("✅ Matrix effect created");
}

/**
 * Fallback editor when Monaco fails to load
 */
function createFallbackEditor() {
  const editorContainer = document.getElementById("ai-code-editor");
  if (editorContainer) {
    editorContainer.innerHTML = `
      <textarea id="fallback-editor" style="
        width: 100%; 
        height: 100%; 
        background: #1e1e1e; 
        color: #d4d4d4; 
        border: none; 
        font-family: 'JetBrains Mono', monospace; 
        font-size: 14px; 
        padding: 10px;
        resize: none;
        outline: none;
      " placeholder="# Viết code của bạn ở đây...\nprint('Hello CodeQuest!')"></textarea>
    `;

    const textarea = document.getElementById("fallback-editor");

    // Create aiEditor-like interface
    window.aiEditor = {
      getValue: () => textarea.value,
      setValue: (value) => {
        textarea.value = value;
      },
      focus: () => textarea.focus(),
      getModel: () => ({ getFullModelRange: () => null }),
    };

    // Handle Ctrl+A to clear content
    textarea.addEventListener("keydown", function (e) {
      if (e.ctrlKey && e.key === "a") {
        e.preventDefault();
        this.select();
        // Allow user to delete selected content naturally
      }
    });

    console.log("⚠️ Using fallback textarea editor");
  }
}

/**
 * Start various AI animations
 */
function startAIAnimations() {
  // Pulse AI activity indicators
  setInterval(() => {
    document.querySelectorAll(".ai-activity-dot").forEach((dot) => {
      dot.style.animation = "none";
      setTimeout(() => {
        dot.style.animation = "aiPulse 2s infinite";
      }, 10);
    });
  }, 5000);

  // Update stats periodically
  setInterval(() => {
    // Simulate small stat changes
    if (Math.random() > 0.7) {
      updateUserStats({
        xp: userStats.xp + Math.floor(Math.random() * 5),
      });
    }
  }, 30000);

  console.log("✅ AI animations started");
}

/**
 * Load user statistics
 */
function loadUserStats() {
  // In a real app, this would load from backend
  const savedStats = localStorage.getItem("codequest-stats");
  if (savedStats) {
    try {
      const parsed = JSON.parse(savedStats);
      Object.assign(userStats, parsed);
      updateUserStats(userStats);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  // Save stats periodically
  setInterval(() => {
    localStorage.setItem("codequest-stats", JSON.stringify(userStats));
  }, 10000);

  console.log("✅ User stats loaded");
}

// ==================== EVENT LISTENERS ====================

document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 DOM loaded, initializing AI Dashboard...");
  initializeAIDashboard();
});

// Immediate fallback for already loaded DOM
if (document.readyState !== "loading") {
  console.log("🚀 DOM already loaded, initializing immediately...");
  setTimeout(initializeAIDashboard, 100);
}

// Additional safety net
setTimeout(() => {
  if (!window.aiEditor) {
    console.log("⚠️ Safety net: Creating editor if missing...");
    createFallbackEditor();
  }
}, 2000);

// Handle window resize
window.addEventListener("resize", function () {
  if (window.aiEditor) {
    window.aiEditor.layout();
  }
});

// Handle visibility change
document.addEventListener("visibilitychange", function () {
  if (document.hidden) {
    // Pause animations when tab is hidden
    document.querySelectorAll(".matrix-column").forEach((col) => {
      col.style.animationPlayState = "paused";
    });
  } else {
    // Resume animations when tab is visible
    document.querySelectorAll(".matrix-column").forEach((col) => {
      col.style.animationPlayState = "running";
    });
  }
});

// Export functions for global access
window.CodeQuestAI = {
  selectLanguageWithAI,
  activateAIMode,
  startAILesson,
  generateAIChallenge,
  runCodeWithAI,
  submitToAI,
  getAIHelp,
  startAIQuiz,
  toggleAIAssistant,
  closeAIAssistant,
  sendToAI,
  toggleAIVoice,
  showAINotification,
  updateUserStats,
  // Debug functions
  testAIConnection,
  manualTestAI,
  generateText,
  autoDetectWorkingModel,
  testAPIVersions,
  // OpenRouter specific functions
  switchAIModel,
  getModelInfo,
  // Access to config for debugging
  getConfig: () => AI_CONFIG,
};

// Export essential functions to global scope for HTML onclick handlers
window.selectLanguageWithAI = selectLanguageWithAI;
window.activateAIMode = activateAIMode;
window.startAILesson = startAILesson;
window.generateAIChallenge = generateAIChallenge;
window.runCodeWithAI = runCodeWithAI;
window.submitToAI = submitToAI;
window.getAIHelp = getAIHelp;
window.startAIQuiz = startAIQuiz;
window.toggleAIAssistant = toggleAIAssistant;
window.closeAIAssistant = closeAIAssistant;
window.sendToAI = sendToAI;
window.toggleAIVoice = toggleAIVoice;
window.showAINotification = showAINotification;
window.startCoding = startCoding;

console.log("🤖 AI Dashboard JavaScript loaded successfully!");

// Immediate editor availability check
setInterval(() => {
  if (!window.aiEditor && document.getElementById("ai-code-editor")) {
    console.log("⚠️ Editor missing, creating fallback...");
    createFallbackEditor();
  }
}, 3000);
