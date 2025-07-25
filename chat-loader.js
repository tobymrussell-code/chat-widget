// Inject n8n Chat CSS
const style = document.createElement('link');
style.rel = 'stylesheet';
style.href = 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css';
document.head.appendChild(style);

// Create chat container
const container = document.createElement('div');
container.id = 'n8n-chat';
container.style.position = 'fixed';
container.style.bottom = '20px';
container.style.right = '20px';
container.style.zIndex = '9999';
document.body.appendChild(container);

// Load UMD script and initialize
const s = document.createElement('script');
s.src = 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.umd.js';
s.onload = function () {
  if (typeof createChat === 'function') {
    createChat({
      container: '#n8n-chat',
      webhookUrl: 'https://myrealassistant.app.n8n.cloud/webhook/1fd2e1ce-9585-48a4-9397-3aa1544b2958/chat',
      showHeader: true,
      title: 'Hi there! 👋',
      placeholder: 'Type your message…',
      showPoweredBy: true
    });
  } else {
    console.error('❌ createChat not loaded');
  }
};
document.body.appendChild(s);
