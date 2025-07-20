import React, { useState, useEffect } from 'react';
import './FloatingChatbot.css';

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userResponses, setUserResponses] = useState({});
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [summary, setSummary] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8000';

  // Start the chat with greeting
  const startChat = async () => {
    setIsLoading(true);
    
    // Add greeting message
    setChatHistory([{
      type: 'bot',
      content: "Hello! 👋 I'm your personal fashion assistant. I can help you get personalized outfit and style recommendations based on your seasonal color analysis (from image upload or quiz). Would you like to get some suggestions?",
      options: ["Yes, I'd love suggestions!", "No, thanks"],
      isGreeting: true
    }]);
    
    setIsLoading(false);
  };

  // Handle greeting response
  const handleGreetingResponse = async (response) => {
    if (response === "No, thanks") {
      setIsOpen(false);
      return;
    }
    
    // User wants suggestions, reset and start the questionnaire
    setIsLoading(true);
    try {
      // First reset the chat to clear any previous responses
      console.log('Resetting chat...');
      await fetch(`${API_BASE_URL}/chat/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('Calling backend API...');
      const apiResponse = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (!apiResponse.ok) {
        throw new Error(`Backend error: ${apiResponse.status}`);
      }
      
      const data = await apiResponse.json();
      console.log('Backend response:', data);
      
      if (data.status === 'question') {
        console.log('Starting questionnaire with question:', data.next_question);
        setCurrentQuestion(data.next_question);
        setChatHistory(prev => [...prev, {
          type: 'user',
          content: response
        }, {
          type: 'bot',
          content: data.next_question.question,
          options: data.next_question.options,
          questionId: data.next_question.id
        }]);
        
        // Check if first question is text type
        if (data.next_question.type === 'text') {
          setShowTextInput(true);
        } else {
          setShowTextInput(false);
        }
      } else if (data.status === 'completed') {
        console.log('All questions already completed, generating recommendations directly...');
        // If all questions are already answered, generate recommendations directly
        await generateRecommendations();
      }
    } catch (error) {
      console.error('Error starting questionnaire:', error);
    }
    setIsLoading(false);
  };

  // Handle user answer
  const handleAnswer = async (answer) => {
    // Check if this is a greeting response
    const lastMessage = chatHistory[chatHistory.length - 1];
    if (lastMessage && lastMessage.isGreeting) {
      await handleGreetingResponse(answer);
      return;
    }

    if (!currentQuestion) return;

    setIsLoading(true);
    
    // Add user response to chat history
    const newChatHistory = [...chatHistory, {
      type: 'user',
      content: answer,
      questionId: currentQuestion.id
    }];
    setChatHistory(newChatHistory);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: currentQuestion.id,
          answer: answer
        })
      });
      const data = await response.json();
      console.log('Chat response:', data);

      if (data.status === 'completed') {
        // All questions answered, generate recommendations
        console.log('All questions completed, generating recommendations...');
        await generateRecommendations();
      } else if (data.status === 'calculating_weather') {
        // Show weather calculation message
        console.log('Calculating weather for:', data.city);
        setChatHistory([...newChatHistory, {
          type: 'bot',
          content: data.message,
          isCalculating: true
        }]);
        
        // Wait a moment then show weather info and get next question
        setTimeout(async () => {
          try {
            // First show the weather information
            setChatHistory(prev => [...prev, {
              type: 'bot',
              content: data.weather_info,
              isWeatherInfo: true
            }]);
            
            // Then get the next question
            const nextResponse = await fetch(`${API_BASE_URL}/chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({})
            });
            const nextData = await nextResponse.json();
            
            if (nextData.status === 'question') {
              setCurrentQuestion(nextData.next_question);
              setChatHistory(prev => [...prev, {
                type: 'bot',
                content: nextData.next_question.question,
                options: nextData.next_question.options,
                questionId: nextData.next_question.id
              }]);
              
              if (nextData.next_question.type === 'text') {
                setShowTextInput(true);
              } else {
                setShowTextInput(false);
              }
            }
          } catch (error) {
            console.error('Error getting next question:', error);
          }
        }, 2000); // Wait 2 seconds to show the calculation message
      } else if (data.status === 'question') {
        setCurrentQuestion(data.next_question);
        setChatHistory([...newChatHistory, {
          type: 'bot',
          content: data.next_question.question,
          options: data.next_question.options,
          questionId: data.next_question.id
        }]);
        
        // Check if next question is text type
        if (data.next_question.type === 'text') {
          setShowTextInput(true);
        } else {
          setShowTextInput(false);
        }
      }
    } catch (error) {
      console.error('Error sending answer:', error);
    }
    setIsLoading(false);
  };

  // Handle text input submission
  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    
    await handleAnswer(textInput.trim());
    setTextInput('');
    setShowTextInput(false);
  };

  // Handle text input key press
  const handleTextKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleTextSubmit();
    }
  };

  // Generate recommendations
  const generateRecommendations = async () => {
    setIsLoading(true);
    try {
      console.log('Generating recommendations...');
      
      // First check if feature data exists (from image upload or quiz)
      try {
        const featureCheck = await fetch(`${API_BASE_URL}/recommendations`);
        if (!featureCheck.ok) {
          throw new Error('No feature data found. Please upload an image or take the color quiz first.');
        }
      } catch (error) {
        throw new Error('No feature data found. Please upload an image or take the color quiz first.');
      }
      
      const response = await fetch(`${API_BASE_URL}/generate-recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Recommendations error:', errorData);
        throw new Error(`Backend error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      
      const data = await response.json();
      console.log('Recommendations response:', data);

      if (data.recommendations) {
        setRecommendations(data.recommendations);
        
        // Create a summary
        const clothingItems = data.recommendations.filter(item => item.category === 'Clothing').slice(0, 2);
        const footwearItems = data.recommendations.filter(item => item.category === 'Footwear').slice(0, 1);
        const careItems = data.recommendations.filter(item => 
          item.category === 'Makeup' || item.category === 'Skincare'
        ).slice(0, 1);
        
        const careCategory = careItems.length > 0 && careItems[0].category === 'Skincare' ? 'skincare' : 'makeup';
        const summaryText = `Based on your preferences, I recommend ${clothingItems.map(item => item.product).join(', ')} for clothing, ${footwearItems.map(item => item.product).join(', ')} for footwear, and ${careItems.map(item => item.product).join(', ')} for ${careCategory}. These items complement your seasonal color palette and current mood.`;
        
        setSummary(summaryText);
        setIsCompleted(true);
        
        setChatHistory(prev => [...prev, {
          type: 'bot',
          content: summaryText,
          isSummary: true
        }]);
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      
      // Show error message in chat
      setChatHistory(prev => [...prev, {
        type: 'bot',
        content: `Sorry, I encountered an error while generating recommendations: ${error.message}. Please make sure you've uploaded an image or taken the color quiz first.`,
        isError: true
      }]);
    }
    setIsLoading(false);
  };

  // Reset chat
  const resetChat = async () => {
    try {
      await fetch(`${API_BASE_URL}/chat/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error resetting chat:', error);
    }
    
    setCurrentQuestion(null);
    setUserResponses({});
    setChatHistory([]);
    setIsCompleted(false);
    setSummary('');
    setRecommendations([]);
    setShowTextInput(false);
    setTextInput('');
  };

  // Open chat and start if not already started
  const openChat = () => {
    console.log('Opening chat...');
    setIsOpen(true);
    if (chatHistory.length === 0) {
      console.log('Starting chat...');
      startChat();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="floating-chat-button" onClick={openChat}>
        <div className="chat-icon">💬</div>
        <span className="chat-label">Get Personalized Recommendations</span>
      </div>

      {/* Chat Modal */}
      {isOpen && (
        <div className="chat-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
            {/* Chat Header */}
            <div className="chat-header">
              <h3>Fashion Assistant</h3>
              <button className="close-button" onClick={() => setIsOpen(false)}>×</button>
            </div>

            {/* Chat Messages */}
            <div className="chat-messages">
              {chatHistory.map((message, index) => (
                <div key={index} className={`message ${message.type}`}>
                  {message.type === 'bot' ? (
                    <div className="bot-message">
                      <div className={`message-content ${message.isCalculating ? 'calculating-weather' : ''} ${message.isWeatherInfo ? 'weather-info' : ''}`}>
                        {message.content}
                      </div>
                      {message.options && (
                        <div className="options">
                          {message.options.map((option, optIndex) => (
                            <button
                              key={optIndex}
                              className="option-button"
                              onClick={() => handleAnswer(option)}
                              disabled={isLoading}
                            >
                              {option}
                            </button>
                          ))}
                          {currentQuestion && currentQuestion.optional && (
                            <button
                              className="option-button skip-button"
                              onClick={() => handleAnswer("")}
                              disabled={isLoading}
                            >
                              Skip
                            </button>
                          )}
                        </div>
                      )}
                      {message.isSummary && (
                        <button
                          className="see-recommendations-button"
                          onClick={() => {
                            // Navigate to recommendations page
                            window.location.href = '/recommendations';
                          }}
                        >
                          See All Recommendations
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="user-message">
                      <div className="message-content">{message.content}</div>
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="message bot">
                  <div className="bot-message">
                    <div className="loading">Thinking...</div>
                  </div>
                </div>
              )}
              
              {/* Text Input for questions like city */}
              {showTextInput && currentQuestion && currentQuestion.type === 'text' && (
                <div className="message bot">
                  <div className="bot-message">
                    <div className="text-input-container">
                      <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        onKeyPress={handleTextKeyPress}
                        placeholder={`Enter your ${currentQuestion.id}...`}
                        className="text-input"
                        disabled={isLoading}
                        autoFocus
                      />
                      <button
                        onClick={handleTextSubmit}
                        disabled={isLoading || !textInput.trim()}
                        className="text-submit-button"
                      >
                        Send
                      </button>
                    </div>
                    {currentQuestion.optional && (
                      <div className="skip-container">
                        <button
                          className="skip-button"
                          onClick={() => handleAnswer("")}
                          disabled={isLoading}
                        >
                          Skip this question
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Chat Footer */}
            <div className="chat-footer">
              {isCompleted && (
                <button className="reset-button" onClick={resetChat}>
                  Start Over
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChatbot; 