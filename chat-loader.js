(function () {
  // Add style
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

  // Function to try loading and checking createChat
  function loadChatBundle() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.umd.js';
    script.onload = function () {
      const maxTries = 10;
      let tries = 0;

      function tryInit() {
        if (typeof createChat === 'function') {
          createChat({
            container: '#n8n-chat',
            webhookUrl: 'https://myrealassistant.app.n8n.cloud/webhook/1fd2e1ce-9585-48a4-9397-3aa1544b2958/chat',
            showHeader: true,
            title: 'Need help? 👋',
            placeholder: 'Type your question…',
            showPoweredBy: true
          });
        } else if (tries < maxTries) {
          tries++;
          setTimeout(tryInit, 500);
        } else {
          console.error('❌ createChat still not defined after retries.');
        }
      }

      tryInit();
    };
    script.onerror = () => console.error('❌ Failed to load n8n chat bundle.');
    document.body.appendChild(script);
  }

  // Wait until the DOM is ready and kvCORE is fully loaded
  setTimeout(loadChatBundle, 1000);
})();
