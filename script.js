// Backboard.io Website JavaScript
// Modern, performance-optimized interactivity

class BackboardWebsite {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupIntersectionObserver();
    this.setupTabSwitching();
    this.setupCopyButtons();
    this.setupMobileMenu();
    this.setupSmoothScrolling();
    this.initializeAnimations();
  }

  setupEventListeners() {
    // Debounced resize handler
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => this.handleResize(), 250);
    });

    // Throttled scroll handler for navbar
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      if (!scrollTimeout) {
        scrollTimeout = setTimeout(() => {
          this.handleScroll();
          scrollTimeout = null;
        }, 16); // ~60fps
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  setupIntersectionObserver() {
    // Create intersection observer for animations
    this.animationObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            // Unobserve after animation to improve performance
            this.animationObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    // Create observer for navigation highlighting
    this.navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.updateActiveNavTab(entry.target.id);
          }
        });
      },
      {
        threshold: 0.5,
        rootMargin: '-20% 0px -20% 0px'
      }
    );

    // Observe elements for animations
    this.observeAnimationElements();
    
    // Observe sections for navigation
    this.observeNavigationSections();
  }

  observeAnimationElements() {
    const elementsToAnimate = document.querySelectorAll(
      '.feature-card, .step, .pricing-card, .section-header'
    );
    
    elementsToAnimate.forEach(el => {
      this.animationObserver.observe(el);
    });
  }

  observeNavigationSections() {
    const sections = document.querySelectorAll('#features, #how-it-works, #examples, #pricing');
    sections.forEach(section => {
      this.navObserver.observe(section);
    });
  }

  updateActiveNavTab(sectionId) {
    // Remove active class from all tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.remove('active');
    });

    // Add active class to corresponding tab
    const activeTab = document.querySelector(`[href="#${sectionId}"]`);
    if (activeTab) {
      activeTab.classList.add('active');
    }
  }

  setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.example-pane');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;
        
        // Update button states
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Update pane visibility
        tabPanes.forEach(pane => {
          pane.classList.remove('active');
          if (pane.id === `${targetTab}-example`) {
            pane.classList.add('active');
          }
        });

        // Re-run syntax highlighting for the new content
        if (window.Prism) {
          setTimeout(() => {
            Prism.highlightAllUnder(document.getElementById(`${targetTab}-example`));
          }, 50);
        }

        // Analytics tracking (if implemented)
        this.trackEvent('code_example_view', { language: targetTab });
      });
    });
  }

  setupCopyButtons() {
    const codeExamples = {
      python: `import backboard

# Initialize client
bb = backboard.Client(api_key="bb_xxxxxxxxx")

# Create memory with your knowledge base
memory = bb.create_memory(
    name="product_support",
    sources=["./docs", "knowledge_base.json"]
)

# Multi-model conversation with persistent context
def handle_customer_query(query):
    # Start with fast model for classification
    classification = bb.chat(
        model="gpt-3.5-turbo",
        messages=[{
            "role": "system",
            "content": "Classify this query: technical, billing, or general"
        }, {
            "role": "user", 
            "content": query
        }],
        memory_id=memory.id
    )
    
    # Use appropriate model based on complexity
    if "technical" in classification.content.lower():
        model = "claude-3-opus"
    else:
        model = "gpt-4"
    
    # Get detailed response with full context
    response = bb.chat(
        model=model,
        messages=[{"role": "user", "content": query}],
        memory_id=memory.id,  # Same memory = full context
        temperature=0.7
    )
    
    return response.content

# Memory persists across sessions
query1 = "I'm having trouble with the Python SDK authentication"
response1 = handle_customer_query(query1)

# Later conversation remembers previous context
query2 = "Can you show me the fix for that auth issue?"
response2 = handle_customer_query(query2)  # Remembers query1!`,

      javascript: `import { BackboardClient } from '@backboard/sdk';

// Initialize client
const bb = new BackboardClient({
  apiKey: process.env.BACKBOARD_API_KEY
});

// Create persistent memory for user sessions
async function createUserMemory(userId, preferences) {
  const memory = await bb.memory.create({
    id: \`user_\${userId}\`,
    metadata: {
      preferences,
      created: new Date().toISOString()
    }
  });
  
  // Add user's documents to memory
  await bb.memory.addSources(memory.id, [
    { type: 'text', content: \`User preferences: \${JSON.stringify(preferences)}\` },
    { type: 'file', path: \`./user_data/\${userId}/history.json\` }
  ]);
  
  return memory;
}

// Chat with context awareness
async function chatWithMemory(userId, message) {
  try {
    const response = await bb.chat({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant with access to user context and preferences.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      memoryId: \`user_\${userId}\`,
      stream: false
    });
    
    // Memory automatically updates with this conversation
    return response.content;
    
  } catch (error) {
    console.error('Chat error:', error);
    throw error;
  }
}

// Switch models while maintaining context
async function getCodeReview(userId, code) {
  // Use Claude for code review
  const review = await bb.chat({
    model: 'claude-3-opus',
    messages: [{
      role: 'user',
      content: \`Please review this code:\\n\\\`\\\`\\\`\\n\${code}\\n\\\`\\\`\\\`\`
    }],
    memoryId: \`user_\${userId}\`  // Same memory = knows user's coding style
  });
  
  return review.content;
}

// Example usage
(async () => {
  const userId = 'dev_123';
  
  // Create memory with user preferences
  await createUserMemory(userId, {
    language: 'JavaScript',
    framework: 'React',
    style: 'functional'
  });
  
  // Chat remembers preferences
  const response = await chatWithMemory(
    userId, 
    "Show me how to create a custom hook"
  );
  console.log(response); // Returns React functional hook example
})();`,

      curl: `# Create a memory with knowledge base
curl -X POST https://api.backboard.io/v1/memory \\
  -H "Authorization: Bearer bb_xxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "documentation_chat",
    "sources": [
      {
        "type": "url",
        "url": "https://docs.mycompany.com/api"
      },
      {
        "type": "text",
        "content": "Company policy: Always be helpful and accurate"
      }
    ]
  }'

# Start conversation with GPT-4
curl -X POST https://api.backboard.io/v1/chat \\
  -H "Authorization: Bearer bb_xxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4",
    "messages": [
      {
        "role": "user",
        "content": "What are the rate limits for our API?"
      }
    ],
    "memory_id": "documentation_chat",
    "temperature": 0.7
  }'

# Continue conversation with Claude (same memory)
curl -X POST https://api.backboard.io/v1/chat \\
  -H "Authorization: Bearer bb_xxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-3-opus",
    "messages": [
      {
        "role": "user", 
        "content": "Can you explain that in more detail with examples?"
      }
    ],
    "memory_id": "documentation_chat"
  }'

# Stream responses for real-time applications
curl -X POST https://api.backboard.io/v1/chat \\
  -H "Authorization: Bearer bb_xxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4-turbo",
    "messages": [
      {
        "role": "user",
        "content": "Write a comprehensive guide for new developers"
      }
    ],
    "memory_id": "documentation_chat",
    "stream": true
  }' --no-buffer

# Export memory for backup or sharing
curl -X GET https://api.backboard.io/v1/memory/documentation_chat/export \\
  -H "Authorization: Bearer bb_xxxxxxxxx" \\
  > memory_backup.json

# Import memory in different environment
curl -X POST https://api.backboard.io/v1/memory/import \\
  -H "Authorization: Bearer bb_xxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d @memory_backup.json`
    };

    document.querySelectorAll('.copy-button').forEach(button => {
      button.addEventListener('click', async () => {
        const codeType = button.dataset.code;
        const code = codeExamples[codeType];
        
        try {
          await navigator.clipboard.writeText(code);
          this.showCopyFeedback(button);
          this.trackEvent('code_copied', { language: codeType });
        } catch (err) {
          // Fallback for older browsers
          this.fallbackCopyToClipboard(code);
          this.showCopyFeedback(button);
        }
      });
    });
  }

  showCopyFeedback(button) {
    const originalText = button.innerHTML;
    button.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <polyline points="20,6 9,17 4,12"/>
      </svg>
      Copied!
    `;
    button.style.color = 'var(--accent-success)';
    
    setTimeout(() => {
      button.innerHTML = originalText;
      button.style.color = '';
    }, 2000);
  }

  fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }
    
    document.body.removeChild(textArea);
  }

  setupMobileMenu() {
    const toggleButton = document.querySelector('.mobile-menu-toggle');
    const navTabs = document.querySelector('.nav-tabs');
    let isMenuOpen = false;

    if (!toggleButton || !navTabs) return;

    toggleButton.addEventListener('click', () => {
      isMenuOpen = !isMenuOpen;
      
      // Toggle menu visibility
      if (isMenuOpen) {
        navTabs.style.display = 'flex';
        navTabs.style.position = 'absolute';
        navTabs.style.top = '100%';
        navTabs.style.left = '0';
        navTabs.style.right = '0';
        navTabs.style.backgroundColor = 'var(--bg-secondary)';
        navTabs.style.borderTop = '1px solid var(--border-primary)';
        navTabs.style.flexDirection = 'column';
        navTabs.style.padding = 'var(--space-md)';
        navTabs.style.zIndex = '1001';
      } else {
        navTabs.style.display = 'none';
      }

      // Animate toggle button
      const spans = toggleButton.querySelectorAll('span');
      if (isMenuOpen) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
      } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }

      this.trackEvent('mobile_menu_toggle', { open: isMenuOpen });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (isMenuOpen && !toggleButton.contains(e.target) && !navTabs.contains(e.target)) {
        toggleButton.click();
      }
    });

    // Close menu when clicking nav link
    navTabs.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        if (isMenuOpen) {
          toggleButton.click();
        }
      });
    });
  }

  setupSmoothScrolling() {
    // Handle navigation link clicks
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = anchor.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          const headerHeight = 60; // Navbar height
          const targetPosition = targetElement.offsetTop - headerHeight;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });

          this.trackEvent('navigation_click', { target: targetId });
        }
      });
    });
  }

  handleScroll() {
    const navbar = document.querySelector('.navbar');
    const scrollY = window.scrollY;
    
    // Update navbar appearance based on scroll
    if (scrollY > 50) {
      navbar.style.backgroundColor = 'rgba(30, 30, 30, 0.98)';
      navbar.style.backdropFilter = 'blur(20px)';
    } else {
      navbar.style.backgroundColor = 'rgba(30, 30, 30, 0.95)';
      navbar.style.backdropFilter = 'blur(10px)';
    }
  }

  handleResize() {
    // Handle responsive adjustments
    const isMobile = window.innerWidth < 768;
    const navTabs = document.querySelector('.nav-tabs');
    
    if (!isMobile && navTabs) {
      // Reset mobile menu styles on desktop
      navTabs.style.display = '';
      navTabs.style.position = '';
      navTabs.style.top = '';
      navTabs.style.left = '';
      navTabs.style.right = '';
      navTabs.style.backgroundColor = '';
      navTabs.style.borderTop = '';
      navTabs.style.flexDirection = '';
      navTabs.style.padding = '';
      navTabs.style.zIndex = '';
    }
  }

  handleKeyboard(e) {
    // Handle keyboard navigation
    if (e.key === 'Escape') {
      // Close mobile menu if open
      const toggleButton = document.querySelector('.mobile-menu-toggle');
      const navTabs = document.querySelector('.nav-tabs');
      
      if (navTabs && navTabs.style.display === 'flex') {
        toggleButton.click();
      }
    }

    // Tab navigation between code examples
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const activeTab = document.querySelector('.tab-button.active');
      if (activeTab && document.activeElement === activeTab) {
        e.preventDefault();
        const tabs = Array.from(document.querySelectorAll('.tab-button'));
        const currentIndex = tabs.indexOf(activeTab);
        let nextIndex;
        
        if (e.key === 'ArrowLeft') {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        } else {
          nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        }
        
        tabs[nextIndex].click();
        tabs[nextIndex].focus();
      }
    }
  }

  initializeAnimations() {
    // Add initial animation states
    const animationElements = document.querySelectorAll(
      '.feature-card, .step, .pricing-card, .section-header'
    );
    
    animationElements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    });

    // Trigger hero animations immediately
    const heroElements = document.querySelectorAll('.hero-text, .code-window');
    heroElements.forEach((el, index) => {
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, index * 200);
    });
  }

  // Analytics tracking (placeholder - implement with your analytics provider)
  trackEvent(eventName, properties = {}) {
    // Example: Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, properties);
    }
    
    // Example: Custom analytics
    if (window.analytics) {
      window.analytics.track(eventName, properties);
    }
    
    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Event tracked:', eventName, properties);
    }
  }

  // Performance monitoring
  measurePerformance() {
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0];
          const loadTime = perfData.loadEventEnd - perfData.fetchStart;
          
          this.trackEvent('page_performance', {
            load_time: Math.round(loadTime),
            dom_ready: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart),
            first_paint: Math.round(performance.getEntriesByType('paint')[0]?.startTime || 0)
          });
        }, 0);
      });
    }
  }

  // Accessibility improvements
  setupAccessibility() {
    // Add proper ARIA labels and roles
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.example-pane');
    
    tabButtons.forEach((button, index) => {
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', tabPanes[index]?.id);
      button.setAttribute('aria-selected', button.classList.contains('active'));
    });

    tabPanes.forEach(pane => {
      pane.setAttribute('role', 'tabpanel');
      pane.setAttribute('aria-hidden', !pane.classList.contains('active'));
    });

    // Add skip link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.position = 'absolute';
    skipLink.style.top = '-40px';
    skipLink.style.left = '6px';
    skipLink.style.background = 'var(--accent-primary)';
    skipLink.style.color = 'white';
    skipLink.style.padding = '8px';
    skipLink.style.borderRadius = '4px';
    skipLink.style.textDecoration = 'none';
    skipLink.style.zIndex = '9999';
    skipLink.style.transition = 'top 0.3s';
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    document.body.prepend(skipLink);
  }
}

// Initialize the website when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new BackboardWebsite();
});

// Handle reduced motion preference
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.style.setProperty('--transition-fast', '0s');
  document.documentElement.style.setProperty('--transition-base', '0s');
  document.documentElement.style.setProperty('--transition-slow', '0s');
}

// Service Worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}