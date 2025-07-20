import React, { useState, useEffect } from 'react';
import './SeasonalQuiz.css';

const SeasonalQuiz = ({ onComplete, onClose }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/quiz/questions`);
      const data = await response.json();
      setQuestions(data.questions);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
    setIsLoading(false);
  };

  const handleAnswer = (answer) => {
    const currentQuestion = questions[currentQuestionIndex];
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));

    // Move to next question or submit
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // All questions answered, submit quiz
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses })
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      const result = await response.json();
      onComplete(result);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
    setIsSubmitting(false);
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  const getProgressPercentage = () => {
    return ((currentQuestionIndex + 1) / questions.length) * 100;
  };

  if (isLoading) {
    return (
      <div className="quiz-modal-overlay">
        <div className="quiz-modal">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading quiz questions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = getProgressPercentage();

  return (
    <div className="quiz-modal-overlay" onClick={onClose}>
      <div className="quiz-modal" onClick={(e) => e.stopPropagation()}>
        {/* Quiz Header */}
        <div className="quiz-header">
          <div className="quiz-title">
            <span className="quiz-icon">🌸</span>
            <h2>Seasonal Color Palette Quiz</h2>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="progress-text">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>

        {/* Question Navigation */}
        <div className="question-nav">
          {questions.map((_, index) => (
            <button
              key={index}
              className={`nav-dot ${index === currentQuestionIndex ? 'active' : ''} ${responses[questions[index]?.id] ? 'answered' : ''}`}
              onClick={() => goToQuestion(index)}
              title={`Question ${index + 1}`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {/* Current Question */}
        <div className="question-container">
          <h3 className="question-text">{currentQuestion.question}</h3>
          
          <div className="options-grid">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className={`option-button ${responses[currentQuestion.id] === option ? 'selected' : ''}`}
                onClick={() => handleAnswer(option)}
                disabled={isSubmitting}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="quiz-navigation">
          <button
            className="nav-button prev-button"
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0 || isSubmitting}
          >
            ← Previous
          </button>
          
          <div className="question-counter">
            {currentQuestionIndex + 1} / {questions.length}
          </div>
          
          {currentQuestionIndex < questions.length - 1 && (
            <button
              className="nav-button next-button"
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              disabled={!responses[currentQuestion.id] || isSubmitting}
            >
              Next →
            </button>
          )}
        </div>

        {/* Submit Button */}
        {currentQuestionIndex === questions.length - 1 && (
          <div className="submit-container">
            <button
              className="submit-button"
              onClick={submitQuiz}
              disabled={!responses[currentQuestion.id] || isSubmitting}
            >
              {isSubmitting ? 'Analyzing...' : 'Get My Color Analysis'}
            </button>
            {isSubmitting && (
              <div className="submitting-message">
                <div className="loading-spinner"></div>
                <p>Analyzing your responses and generating your seasonal color palette...</p>
                <p className="chatbot-note">💡 After your analysis, look for the floating chat button to get personalized fashion recommendations!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeasonalQuiz; 