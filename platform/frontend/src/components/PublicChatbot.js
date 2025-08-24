import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Fab,
  Collapse,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Button,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Send as SendIcon,
  Close as CloseIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  QuestionMark as QuestionIcon,
} from '@mui/icons-material';
import chatbotService from '../services/chatbotService';

export default function PublicChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load suggested questions on component mount
  useEffect(() => {
    const loadSuggestedQuestions = async () => {
      try {
        const questions = await chatbotService.getSuggestedQuestions();
        setSuggestedQuestions(questions);
      } catch (error) {
        console.error('Error loading suggested questions:', error);
        setSuggestedQuestions([
          "What is SpartUp and how can it help my startup?",
          "How do I connect with mentors?",
          "What types of startup events are available?",
          "How can I join the SpartUp community?"
        ]);
      }
    };

    if (isOpen) {
      loadSuggestedQuestions();
    }
  }, [isOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chatbot opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Hello! 👋 Welcome to SpartUp! I\'m here to help you learn about our startup ecosystem platform. How can I assist you today?',
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, messages.length]);

  const handleSendMessage = async (messageText = null) => {
    const message = messageText || inputMessage.trim();
    if (!message || isLoading) return;

    setInputMessage('');
    setError(null);
    setShowSuggestions(false);

    // Add user message
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Prepare conversation history (last 10 messages to stay within context limits)
      const conversationHistory = messages
        .slice(-10)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      const response = await chatbotService.sendMessage(message, conversationHistory);
      
      // Add bot response
      const botMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (err) {
      console.error('Chatbot error:', err);
      setError('Sorry, I\'m having trouble connecting right now. Please try again in a moment.');
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'I apologize, but I\'m experiencing some technical difficulties. Please try asking your question again, or feel free to explore the platform directly!',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setShowSuggestions(true);
    setError(null);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const formatMessageContent = (content) => {
    return { __html: chatbotService.formatResponse(content) };
  };

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="chat"
        onClick={toggleChat}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1300,
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
            transform: 'scale(1.1)',
          },
          transition: 'all 0.3s ease-in-out',
        }}
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </Fab>

      {/* Chat Window */}
      <Collapse in={isOpen}>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 100,
            right: 24,
            width: { xs: '90vw', sm: 400 },
            height: { xs: '70vh', sm: 500 },
            zIndex: 1200,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'primary.light',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              color: 'white',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 32, height: 32 }}>
                <BotIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  SpartUp Assistant
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Ask me about our startup ecosystem
                </Typography>
              </Box>
            </Box>
            <Box>
              <Tooltip title="Clear chat">
                <IconButton
                  size="small"
                  onClick={handleClearChat}
                  sx={{ color: 'white', mr: 1 }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Close chat">
                <IconButton
                  size="small"
                  onClick={toggleChat}
                  sx={{ color: 'white' }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Messages Area */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 1,
              backgroundColor: '#f8fafc',
            }}
          >
            <List sx={{ py: 0 }}>
              {messages.map((message) => (
                <ListItem
                  key={message.id}
                  sx={{
                    display: 'flex',
                    flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    px: 1,
                    py: 0.5,
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 40 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                      }}
                    >
                      {message.role === 'user' ? (
                        <PersonIcon fontSize="small" />
                      ) : (
                        <BotIcon fontSize="small" />
                      )}
                    </Avatar>
                  </ListItemAvatar>
                  <Box
                    sx={{
                      maxWidth: '75%',
                      ml: message.role === 'user' ? 0 : 1,
                      mr: message.role === 'user' ? 1 : 0,
                    }}
                  >
                    <Paper
                      sx={{
                        p: 2,
                        backgroundColor: message.role === 'user' ? 'primary.main' : 'white',
                        color: message.role === 'user' ? 'white' : 'text.primary',
                        borderRadius: 2,
                        borderTopLeftRadius: message.role === 'user' ? 2 : 0.5,
                        borderTopRightRadius: message.role === 'user' ? 0.5 : 2,
                        border: message.isError ? '1px solid' : 'none',
                        borderColor: message.isError ? 'error.main' : 'transparent',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          lineHeight: 1.4,
                          '& p': { margin: 0, mb: 1 },
                          '& p:last-child': { mb: 0 },
                        }}
                        dangerouslySetInnerHTML={formatMessageContent(message.content)}
                      />
                    </Paper>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        textAlign: message.role === 'user' ? 'right' : 'left',
                      }}
                    >
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                </ListItem>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <ListItem sx={{ justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    Thinking...
                  </Typography>
                </ListItem>
              )}

              {/* Suggested questions */}
              {showSuggestions && messages.length <= 1 && (
                <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch', py: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    💡 Suggested questions:
                  </Typography>
                  <Stack spacing={1}>
                    {suggestedQuestions.slice(0, 4).map((question, index) => (
                      <Chip
                        key={index}
                        label={question}
                        variant="outlined"
                        size="small"
                        clickable
                        onClick={() => handleSendMessage(question)}
                        sx={{
                          justifyContent: 'flex-start',
                          height: 'auto',
                          py: 1,
                          '& .MuiChip-label': {
                            whiteSpace: 'normal',
                            textAlign: 'left',
                          },
                        }}
                      />
                    ))}
                  </Stack>
                </ListItem>
              )}

              <div ref={messagesEndRef} />
            </List>
          </Box>

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ m: 1 }}>
              {error}
            </Alert>
          )}

          {/* Input Area */}
          <Box sx={{ p: 2, backgroundColor: 'white', borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
              <TextField
                ref={inputRef}
                fullWidth
                multiline
                maxRows={3}
                variant="outlined"
                placeholder="Ask me about SpartUp..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                  },
                }}
              />
              <IconButton
                color="primary"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '&.Mui-disabled': {
                    backgroundColor: 'grey.300',
                    color: 'grey.500',
                  },
                }}
              >
                <SendIcon fontSize="small" />
              </IconButton>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
              Powered by AI • Ask about mentors, events, and more
            </Typography>
          </Box>
        </Paper>
      </Collapse>
    </>
  );
}
