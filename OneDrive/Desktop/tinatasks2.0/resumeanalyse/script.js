// Clean text to remove weird symbols and normalize spaces
function cleanText(text) {
  return text
    .replace(/[^\x20-\x7E\n]/g, "") // keep only normal ASCII characters
    .replace(/\s+/g, " ")           // normalize spaces
    .trim();
}

// Load file content into textarea
function loadFile(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById("resumeInput").value = e.target.result;
    };
    reader.readAsText(file);
  }
}

// Analyze resume and give score
function analyzeResume() {
  let resumeText = document.getElementById("resumeInput").value;
  resumeText = cleanText(resumeText); // clean before analyzing

  const resultsDiv = document.getElementById("results");

  if (!resumeText.trim()) {
    resultsDiv.innerHTML = "<p style='color:red;'>Please upload or paste your resume!</p>";
    return;
  }

  let wordCount = resumeText.split(/\s+/).length;

  // Important sections
  const sections = ["Education", "Experience", "Skills", "Projects", "Certifications"];
  let missingSections = sections.filter(section => !resumeText.toLowerCase().includes(section.toLowerCase()));

  // Keywords
  const keywords = ["JavaScript", "Python", "SQL", "HTML", "CSS", "React", "Node"];
  let foundKeywords = keywords.filter(keyword => resumeText.toLowerCase().includes(keyword.toLowerCase()));

  // --- Scoring Logic ---
  let score = 0;

  // Word count contribution
  if (wordCount >= 300 && wordCount <= 800) score += 30;
  else if (wordCount > 150) score += 15;

  // Sections contribution
  score += ((sections.length - missingSections.length) / sections.length) * 40;

  // Keywords contribution
  score += (foundKeywords.length / keywords.length) * 30;

  score = Math.round(score);

  // Feedback message
  let feedback = "";
  if (score >= 70) feedback = "Excellent Resume ✅";
  else if (score >= 40) feedback = "Needs Improvement ⚠️";
  else feedback = "Weak Resume ❌";

  // --- Output ---
  resultsDiv.innerHTML = `
    <h3>Analysis Results:</h3>
    <p><strong>Word Count:</strong> ${wordCount}</p>
    <p><strong>Found Keywords:</strong> ${foundKeywords.length > 0 ? 
      "<span class='keyword-found'>" + foundKeywords.join(", ") + "</span>" : 
      "<span class='section-missing'>None</span>"}</p>
    <p><strong>Missing Sections:</strong> ${missingSections.length > 0 ? 
      "<span class='section-missing'>" + missingSections.join(", ") + "</span>" : 
      "<span class='keyword-found'>None</span>"}</p>
    <h2>Resume Score: ${score}/100</h2>
    <div class="progress-container">
      <div class="progress-bar" style="width:${score}%; background:${score >= 70 ? '#27ae60' : score >= 40 ? '#f39c12' : '#e74c3c'};"></div>
    </div>
    <p style="font-size:18px; font-weight:600; margin-top:10px; color:${score >= 70 ? '#27ae60' : score >= 40 ? '#f39c12' : '#e74c3c'};">
      ${feedback}
    </p>
  `;
}