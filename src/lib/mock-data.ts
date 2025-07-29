export type Question = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
};

export type Exam = {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  duration: number; // in minutes
  questions: Question[];
};

export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'q1',
    question: 'Which hook is used to perform side effects in a function component?',
    options: ['useState', 'useEffect', 'useContext', 'useReducer'],
    correctAnswer: 'useEffect'
  },
  {
    id: 'q2',
    question: 'What does HTML stand for?',
    options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Hyperlink and Text Markup Language', 'Home Tool Markup Language'],
    correctAnswer: 'Hyper Text Markup Language'
  },
  {
    id: 'q3',
    question: 'Which CSS property is used to change the text color of an element?',
    options: ['font-color', 'text-color', 'color', 'font-style'],
    correctAnswer: 'color'
  },
  {
    id: 'q4',
    question: 'In JavaScript, what is a closure?',
    options: ['A function having access to the parent scope, even after the parent function has closed.', 'A special type of loop.', 'An object that holds key/value pairs.', 'A way to style components.'],
    correctAnswer: 'A function having access to the parent scope, even after the parent function has closed.'
  },
  {
    id: 'q5',
    question: 'What is the correct syntax for referring to an external script called "app.js"?',
    options: ['<script src="app.js">', '<script name="app.js">', '<script href="app.js">', '<script file="app.js">'],
    correctAnswer: '<script src="app.js">'
  },
];


export const MOCK_EXAMS: Exam[] = [
  { 
    id: 'cs101-midterm', 
    title: 'Mid-Term Exam: Computer Science', 
    description: 'Covers fundamental concepts of computer science including data structures and algorithms.', 
    questionCount: 5, 
    duration: 10,
    questions: MOCK_QUESTIONS,
  },
  { 
    id: 'webdev-final', 
    title: 'Final Exam: Web Development', 
    description: 'A comprehensive exam on HTML, CSS, JavaScript, and React.', 
    questionCount: 5, 
    duration: 10,
    questions: MOCK_QUESTIONS,
  },
  { 
    id: 'react-quiz1', 
    title: 'Quiz 1: React Hooks', 
    description: 'A quick 5-question quiz on the most common React Hooks.', 
    questionCount: 5, 
    duration: 5,
    questions: MOCK_QUESTIONS,
  },
    { 
    id: 'js-advanced', 
    title: 'Advanced JavaScript Concepts', 
    description: 'Test your knowledge on closures, promises, and async/await.', 
    questionCount: 5, 
    duration: 8,
    questions: MOCK_QUESTIONS,
  },
];

export const MOCK_USER_RESULTS = [
  { id: 'res1', user: 'Alice Johnson', email: 'alice@example.com', exam: 'Mid-Term Exam: Computer Science', score: '85%', date: '2024-05-10' },
  { id: 'res2', user: 'Bob Williams', email: 'bob@example.com', exam: 'Mid-Term Exam: Computer Science', score: '92%', date: '2024-05-10' },
  { id: 'res3', user: 'Charlie Brown', email: 'charlie@example.com', exam: 'Final Exam: Web Development', score: '78%', date: '2024-05-11' },
  { id: 'res4', user: 'Diana Prince', email: 'diana@example.com', exam: 'Quiz 1: React Hooks', score: '100%', date: '2024-05-12' },
  { id: 'res5', user: 'Ethan Hunt', email: 'ethan@example.com', exam: 'Final Exam: Web Development', score: '88%', date: '2024-05-11' },
];
