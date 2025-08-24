// Chatbot service for OpenRouter API integration
import api from './api.js';

const OPENROUTER_API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY || 'your-openrouter-api-key-here';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Base system prompt - will be enhanced with real data
const BASE_SYSTEM_PROMPT = `
You are a helpful AI assistant for the SpartUp Ecosystem platform. You have access to real-time information about our mentors, events, newsletters, and platform statistics.

ABOUT SPARTUP:
SpartUp is a comprehensive startup ecosystem platform that connects entrepreneurs, mentors, investors, and innovators. The platform serves as a central hub for startup activities, networking, and resource sharing.

CONVERSATION GUIDELINES:
- Be enthusiastic and supportive about entrepreneurship
- Use the specific data provided to give accurate, current information
- Mention specific mentors, events, or newsletters when relevant
- Provide concrete numbers and details from the platform data
- Encourage users to explore specific opportunities you mention
- Keep responses concise but informative
- Always maintain a positive, encouraging tone about startup journeys
- If asked about something not in the data, suggest they explore the platform or contact administrators

Remember: You are here to help visitors understand how SpartUp can support their entrepreneurial journey and connect them with the right resources and people using real, current information from our platform.
`;

class ChatbotService {
  constructor() {
    this.apiKey = OPENROUTER_API_KEY;
    this.baseUrl = OPENROUTER_BASE_URL;
    this.model = 'openai/gpt-oss-20b:free'; // Using the free model you specified
    this.platformData = null;
    this.dataLastFetched = null;
    this.dataCacheDuration = 5 * 60 * 1000; // 5 minutes cache
  }

  // Fetch real platform data from your API
  async fetchPlatformData() {
    try {
      // Check if we have recent cached data
      if (this.platformData && this.dataLastFetched && 
          (Date.now() - this.dataLastFetched) < this.dataCacheDuration) {
        // Using cached platform data
        return this.platformData;
      }

      // Fetching fresh platform data from API
      const data = {
        mentors: [],
        events: [],
        newsletters: [],
        stats: {}
      };

      // Try to fetch data from backend API
      try {
              const [mentorsResponse, eventsResponse, newslettersResponse, statsResponse] = await Promise.allSettled([
        api.get('/api/opportunities'),
        api.get('/api/events'),
        api.get('/api/newsletters'),
        api.get('/api/engagement/stats')
      ]);

        // Process mentors data (from opportunities endpoint)
        if (mentorsResponse.status === 'fulfilled' && mentorsResponse.value.status === 200) {
          const mentorsData = mentorsResponse.value.data;
          // Mentors data received
          data.mentors = mentorsData.slice(0, 10).map(mentor => ({
            name: mentor.full_name,
            expertise: mentor.expertise || 'Startup Mentor',
            bio: mentor.bio || `${mentor.full_name} from ${mentor.organization || 'SpartUp'}`
          })); // Limit to top 10 for context
        } else {
          console.warn('Mentors API failed:', mentorsResponse.status, mentorsResponse.value?.status);
        }

        // Process events data
        if (eventsResponse.status === 'fulfilled' && eventsResponse.value.status === 200) {
          const eventsData = eventsResponse.value.data;
          // Events data received
          data.events = eventsData.slice(0, 10).map(event => ({
            title: event.title,
            date: event.start_date,
            description: event.description
          })); // Limit to top 10 for context
        } else {
          console.warn('Events API failed:', eventsResponse.status, eventsResponse.value?.status);
        }

        // Process newsletters data
        if (newslettersResponse.status === 'fulfilled' && newslettersResponse.value.status === 200) {
          const newslettersData = newslettersResponse.value.data;
          // Newsletters data received
          data.newsletters = newslettersData.slice(0, 5).map(newsletter => ({
            title: newsletter.title,
            publish_date: newsletter.publish_date,
            content: newsletter.content
          })); // Limit to top 5 for context
        } else {
          console.warn('Newsletters API failed:', newslettersResponse.status, newslettersResponse.value?.status);
        }

        // Process stats data
        if (statsResponse.status === 'fulfilled' && statsResponse.value.status === 200) {
          const statsData = statsResponse.value.data;
          data.stats = statsData;
        }

      } catch (apiError) {
        console.warn('API not available, using fallback data:', apiError);
        console.warn('API Error details:', apiError.message);
        // Use fallback data when API is not available
        data.mentors = [
          {
            name: "Dr. Sarah Chen",
            expertise: "AI/ML & Startup Strategy",
            bio: "Experienced AI researcher and startup advisor with 15+ years in Silicon Valley tech companies."
          },
          {
            name: "Mike Rodriguez",
            expertise: "Business Development",
            bio: "Serial entrepreneur and business development expert who has helped scale 10+ startups."
          },
          {
            name: "Lisa Thompson",
            expertise: "Marketing & Growth",
            bio: "Digital marketing specialist with expertise in growth hacking and customer acquisition."
          }
        ];

        data.events = [
          {
            title: "Startup Pitch Competition",
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            description: "Annual pitch competition for student entrepreneurs with $10,000 in prizes."
          },
          {
            title: "AI in Business Workshop",
            date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            description: "Learn how to integrate AI into your startup strategy and operations."
          },
          {
            title: "Networking Mixer",
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            description: "Connect with mentors, investors, and fellow entrepreneurs."
          }
        ];

        data.newsletters = [
          {
            title: "Weekly Startup Opportunities",
            publish_date: new Date().toISOString(),
            content: "Latest startup opportunities, funding announcements, and community updates."
          },
          {
            title: "Mentor Spotlight",
            publish_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            content: "Featured mentor profiles and success stories from our community."
          }
        ];

        data.stats = {
          total_users: 500,
          total_mentors: 25,
          total_events: 30,
          total_newsletters: 15,
          total_rsvps: 120,
          total_logins: 2500
        };
      }

      // Final platform data summary
      
      this.platformData = data;
      this.dataLastFetched = Date.now();
      return data;

    } catch (error) {
      console.error('Error in fetchPlatformData:', error);
      // Return cached data or empty structure
      return this.platformData || { 
        mentors: [], 
        events: [], 
        newsletters: [], 
        stats: {} 
      };
    }
  }

  // Create summarized platform data for the prompt
  async createPlatformDataSummary() {
    const data = await this.fetchPlatformData();
    
    // Create a clean, summarized version of the data
    const summary = {
      mentors: data.mentors?.slice(0, 5).map(m => ({
        name: m.name,
        expertise: m.expertise || 'Startup Mentor',
        bio: m.bio?.substring(0, 80) + (m.bio?.length > 80 ? '...' : '')
      })) || [],
      events: data.events?.slice(0, 5).map(e => ({
        title: e.title,
        date: e.date ? new Date(e.date).toLocaleDateString() : null,
        description: e.description?.substring(0, 80) + (e.description?.length > 80 ? '...' : '')
      })) || [],
      newsletters: data.newsletters?.slice(0, 3).map(n => ({
        title: n.title,
        publish_date: n.publish_date ? new Date(n.publish_date).toLocaleDateString() : null,
        content: n.content?.substring(0, 80) + (n.content?.length > 80 ? '...' : '')
      })) || [],
      stats: data.stats || {}
    };

    return summary;
  }

  // Get current platform data summary (for debugging or other uses)
  async getCurrentPlatformData() {
    return await this.createPlatformDataSummary();
  }

  // Debug method to test data fetching
  async debugDataFetching() {
    console.log('=== DEBUGGING DATA FETCHING ===');
    const data = await this.fetchPlatformData();
    console.log('Raw data:', data);
    return data;
  }

  // Create enhanced system prompt with summarized data
  async createEnhancedSystemPrompt() {
    const dataSummary = await this.createPlatformDataSummary();
    
    let enhancedPrompt = BASE_SYSTEM_PROMPT + '\n\n';

    // Add summarized mentors information
    if (dataSummary.mentors.length > 0) {
      enhancedPrompt += 'CURRENT MENTORS:\n';
      dataSummary.mentors.forEach((mentor, index) => {
        enhancedPrompt += `${index + 1}. ${mentor.name} - ${mentor.expertise}`;
        if (mentor.bio) enhancedPrompt += `\n   ${mentor.bio}`;
        enhancedPrompt += '\n';
      });
      enhancedPrompt += `\nTotal Mentors Available: ${dataSummary.mentors.length}\n\n`;
    }

    // Add summarized events information
    if (dataSummary.events.length > 0) {
      enhancedPrompt += 'UPCOMING EVENTS:\n';
      dataSummary.events.forEach((event, index) => {
        enhancedPrompt += `${index + 1}. ${event.title}`;
        if (event.date) enhancedPrompt += ` (${event.date})`;
        if (event.description) enhancedPrompt += `\n   ${event.description}`;
        enhancedPrompt += '\n';
      });
      enhancedPrompt += `\nTotal Events Available: ${dataSummary.events.length}\n\n`;
    }

    // Add summarized newsletters information
    if (dataSummary.newsletters.length > 0) {
      enhancedPrompt += 'RECENT NEWSLETTERS:\n';
      dataSummary.newsletters.forEach((newsletter, index) => {
        enhancedPrompt += `${index + 1}. ${newsletter.title}`;
        if (newsletter.publish_date) enhancedPrompt += ` (${newsletter.publish_date})`;
        if (newsletter.content) enhancedPrompt += `\n   ${newsletter.content}`;
        enhancedPrompt += '\n';
      });
      enhancedPrompt += `\nTotal Newsletters Available: ${dataSummary.newsletters.length}\n\n`;
    }

    // Add key platform statistics
    if (dataSummary.stats) {
      enhancedPrompt += 'PLATFORM STATISTICS:\n';
      if (dataSummary.stats.total_users) enhancedPrompt += `- Total Users: ${dataSummary.stats.total_users}\n`;
      if (dataSummary.stats.total_mentors) enhancedPrompt += `- Total Mentors: ${dataSummary.stats.total_mentors}\n`;
      if (dataSummary.stats.total_events) enhancedPrompt += `- Total Events: ${dataSummary.stats.total_events}\n`;
      if (dataSummary.stats.total_newsletters) enhancedPrompt += `- Total Newsletters: ${dataSummary.stats.total_newsletters}\n`;
      enhancedPrompt += '\n';
    }

    enhancedPrompt += 'INSTRUCTIONS: Use this specific data to provide accurate, current information about our platform. Mention specific mentors, events, and newsletters when relevant to user questions.';

    return enhancedPrompt;
  }

  async sendMessage(userMessage, conversationHistory = []) {
    try {
      // Get enhanced system prompt with real data
      const enhancedSystemPrompt = await this.createEnhancedSystemPrompt();
      
      // Prepare messages array with enhanced system prompt and conversation history
      const messages = [
        {
          role: 'system',
          content: enhancedSystemPrompt
        },
        ...conversationHistory,
        {
          role: 'user',
          content: userMessage
        }
      ];

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'SpartUp Ecosystem Platform',
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          max_tokens: 500,
          temperature: 0.7,
          top_p: 0.9,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from API');
      }

      return {
        content: data.choices[0].message.content.trim(),
        usage: data.usage
      };

    } catch (error) {
      console.error('Chatbot API Error:', error);
      throw new Error(`Failed to get response: ${error.message}`);
    }
  }

  // Format the response for display
  formatResponse(content) {
    // Clean up any unwanted formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic text
      .replace(/\n\n/g, '</p><p>') // Paragraphs
      .replace(/\n/g, '<br>') // Line breaks
      .replace(/^/, '<p>') // Start paragraph
      .replace(/$/, '</p>'); // End paragraph
  }

  // Get suggested questions for users
  async getSuggestedQuestions() {
    try {
      const data = await this.fetchPlatformData();
      const questions = [
        "What is SpartUp and how can it help my startup?",
        "How do I connect with mentors?",
        "What types of startup events are available?",
        "How can I join the SpartUp community?",
        "What resources are available for new entrepreneurs?",
        "How do I find mentors in my industry?",
        "What's the difference between member and mentor roles?",
        "How do I stay updated with startup opportunities?"
      ];

      // Add dynamic questions based on available data
      if (data.mentors && data.mentors.length > 0) {
        questions.push(`Tell me about the ${data.mentors.length} mentors available`);
      }
      
      if (data.events && data.events.length > 0) {
        questions.push(`What are the upcoming ${data.events.length} events?`);
      }
      
      if (data.newsletters && data.newsletters.length > 0) {
        questions.push(`What's in the latest newsletters?`);
      }

      return questions.slice(0, 8); // Return top 8 questions
    } catch (error) {
      console.error('Error getting suggested questions:', error);
      return [
        "What is SpartUp and how can it help my startup?",
        "How do I connect with mentors?",
        "What types of startup events are available?",
        "How can I join the SpartUp community?"
      ];
    }
  }
}

export default new ChatbotService();
