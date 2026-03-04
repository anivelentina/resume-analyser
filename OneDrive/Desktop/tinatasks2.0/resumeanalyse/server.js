const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration – in a real application these should be
// stored in environment variables and **never** committed to source control.
// You can place them in a .env file and load them with dotenv.
const supabaseUrl = process.env.SUPABASE_URL ||
  "https://ytozztygvtawaxohsise.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0b3p6dHlndnRhd2F4b2hzaXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MTUyNjUsImV4cCI6MjA4NjI5MTI2NX0.ygNuHPqf-uGlfDJtX5c5pcpS1cxnHDKs6tqnqrwXLLw";

// create and export a supabase client instance that can be used
// anywhere in the application
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const port = 

app.use(cors());
app.use(express.json()); // For parsing application/json

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

function cleanText(text) {
    return text
        .replace(/[^\x20-\x7E\n]/g, "") // keep only normal ASCII characters
        .replace(/\s+/g, " ")           // normalize spaces
        .trim();
}

function analyzeText(resumeText) {
    // Analysis Logic
    const wordCount = resumeText.split(/\s+/).length;

    const sections = ["Education", "Experience", "Skills", "Projects", "Certifications"];
    const missingSections = sections.filter(section => !resumeText.toLowerCase().includes(section.toLowerCase()));

    const keywords = ["JavaScript", "Python", "SQL", "HTML", "CSS", "React", "Node"];
    const foundKeywords = keywords.filter(keyword => resumeText.toLowerCase().includes(keyword.toLowerCase()));

    let score = 0;

    // Word count check
    if (wordCount >= 300 && wordCount <= 800) score += 30;
    else if (wordCount > 150) score += 15;

    // Sections check
    score += ((sections.length - missingSections.length) / sections.length) * 40;

    // Keywords check
    score += (foundKeywords.length / keywords.length) * 30;

    score = Math.round(score);

    let feedback = "";
    if (score >= 70) feedback = "Excellent Resume ✅";
    else if (score >= 40) feedback = "Needs Improvement ⚠️";
    else feedback = "Weak Resume ❌";

    return {
        score,
        feedback,
        wordCount,
        missingSections,
        foundKeywords
    };
}

app.post('/analyze', upload.single('resume'), async (req, res) => {
    console.log("Analyze route hit");
console.log("File:", req.file);
    try {
        let resumeText = "";

        // Scenario 1: File Upload
        if (req.file) {
            console.log("File received:",req.file);
            const fileName = Date.now() + "_" + req.file.originalname;

const { data, error } = await supabase.storage
    .from('resumes')
    .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype
    });

if (error) {
    console.log(error);
    return res.status(500).json({ error: "File upload failed" });
}

console.log("Stored in Supabase:", data.path);
            const fileBuffer = req.file.buffer;
            const mimeType = req.file.mimetype;

            if (mimeType === 'application/pdf') {
                const data = await pdfParse(fileBuffer);
                resumeText = data.text;
            } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { // docx
                const result = await mammoth.extractRawText({ buffer: fileBuffer });
                resumeText = result.value;
            } else {
                // Default to text plain
                resumeText = fileBuffer.toString('utf8');
            }
        }
        // Scenario 2: Text Input
        else if (req.body.text) {
            resumeText = req.body.text;
        } else {
            return res.status(400).json({ error: "No resume provided (file or text)." });
        }

        // Clean and Analyze
        const cleanedText = cleanText(resumeText);
        if (!cleanedText) {
            return res.status(400).json({ error: "Could not extract text from resume." });
        }

        const result = analyzeText(cleanedText);
        res.json(result);

    } catch (error) {
        console.error("Analysis Error:", error);
        res.status(500).json({ error: "Failed to process resume." });
    }
});
app.get("/", (req, res) => {
    res.send("Resume Analyzer Backend is Working ✅");
});
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
