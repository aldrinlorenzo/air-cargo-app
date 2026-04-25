import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChatbotService } from '../../services/chatbot.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit {
  isOpen = false;
  messages: ChatMessage[] = [];
  userInput: string = '';
  isLoading = false;
  xmlContext: string | null = null;
  awbContext: string | null = null;
  hasAwbData = false;

  // Quick action suggestions
  quickActions: string[] = [
    'What DG items are in this shipment?',
    'Did all checks pass?',
    'What is the DG declaration process?',
    'Explain IATA DG AutoCheck',
    'What packing instructions apply?'
  ];

  constructor(private http: HttpClient, private chatbotService: ChatbotService) {}

  ngOnInit() {
    this.chatbotService.currentXmlContext.subscribe(xml => {
      this.xmlContext = xml;
    });

    this.chatbotService.currentAwbContext.subscribe(awb => {
      this.awbContext = awb;
      this.hasAwbData = !!awb;
    });
    
    // Initial greeting
    this.messages.push({
      role: 'assistant',
      content: 'Hello! I\'m Skyler, your DGR Assistant. I can help you with:\n\n• DG shipment details & check results\n• IATA Dangerous Goods Regulations\n• DG declaration & AutoCheck processes\n• Packing instructions & compliance\n\nSearch an AWB above and I\'ll have your shipment context ready!'
    });
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  useQuickAction(action: string) {
    this.userInput = action;
    this.sendMessage();
  }

  sendMessage() {
    if (!this.userInput.trim() || this.isLoading) return;

    const userText = this.userInput;
    this.messages.push({ role: 'user', content: userText });
    this.userInput = '';
    this.isLoading = true;

    // Build context from all available sources
    const contextParts: string[] = [];
    
    if (this.awbContext) {
      contextParts.push(this.awbContext);
    }
    
    if (this.xmlContext) {
      contextParts.push(`\n=== UPLOADED XSDG XML ===\n${this.xmlContext}`);
    }

    const context = contextParts.length > 0 ? contextParts.join('\n') : null;

    this.http.post<any>('http://localhost:8000/ai', { 
      text: userText,
      context: context
    }).subscribe({
      next: (response) => {
        const result = response.result?.data || response.result || response;
        let answer = "I couldn't process that request.";
        
        if (result.answer) {
          answer = result.answer;
        } else if (result.violation) {
          answer = `⚠️ Violation: ${result.violation}\n\n📋 Reference: ${result.regulation_reference || 'N/A'}\n\n🔧 Action Required: ${result.action_required || 'None'}`;
        } else if (result.message) {
          answer = result.message;
        }

        this.messages.push({ role: 'assistant', content: answer });
        this.isLoading = false;
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Chat error:', error);
        this.messages.push({ role: 'assistant', content: 'Sorry, I\'m having trouble connecting to the backend. Please make sure the backend server is running on port 8000.' });
        this.isLoading = false;
        this.scrollToBottom();
      }
    });
  }
  
  scrollToBottom() {
    setTimeout(() => {
      const container = document.getElementById('chat-messages-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }
}
