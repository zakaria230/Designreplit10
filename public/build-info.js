// Diagnostic script for identifying deployment issues
(function() {
  console.log('DesignKorv Diagnostics Loaded');
  
  // Signal that we've loaded the app
  window.appLoaded = true;
  
  // Create diagnostic overlay
  function createDiagnosticElement() {
    // Don't create diagnostic element if we're not having issues
    if (document.querySelector('#root') && document.querySelector('#root').children.length > 0) {
      return;
    }
    
    // Create diagnostic overlay
    const diagElement = document.createElement('div');
    diagElement.className = 'diagnostic-overlay';
    diagElement.innerHTML = `
      <h3>DesignKorv Diagnostics</h3>
      <p>Page URL: ${window.location.href}</p>
      <p>Build Time: ${new Date().toISOString()}</p>
      <p>Running diagnostics...</p>
    `;
    document.body.appendChild(diagElement);
    
    // Check main bundle loading
    const scripts = document.querySelectorAll('script');
    const scriptPaths = Array.from(scripts).map(s => s.src).join(', ');
    
    // Update diagnostic info
    setTimeout(function() {
      const rootElement = document.querySelector('#root');
      diagElement.innerHTML += `
        <p>Root element children: ${rootElement ? rootElement.children.length : 'Not found'}</p>
        <p>Scripts loaded: ${scripts.length}</p>
        <p>Main bundle loaded: ${scriptPaths.includes('index') ? 'Yes' : 'No'}</p>
        <button onclick="window.location.href='/diagnose'">Run Server Diagnostics</button>
        <button onclick="window.location.href='/fallback'">View Fallback Page</button>
      `;
    }, 1000);
  }
  
  // Wait for DOMContentLoaded to check for issues
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(createDiagnosticElement, 2000);
    
    // Log basic environment info
    console.log('Browser: ' + navigator.userAgent);
    console.log('URL: ' + window.location.href);
    console.log('Protocol: ' + window.location.protocol);
    
    // Try to detect common module loading issues
    const hasImportMap = !!document.querySelector('script[type="importmap"]');
    const hasModuleScripts = !!document.querySelector('script[type="module"]');
    
    console.log('Import maps supported: ' + (hasImportMap || 'Not used'));
    console.log('ES modules used: ' + (hasModuleScripts ? 'Yes' : 'No'));
    
    // Check root element
    const rootEl = document.getElementById('root');
    if (rootEl) {
      console.log('Root element found');
      
      // Monitor for changes to the root element
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            console.log('App content loaded into root element');
            observer.disconnect();
          }
        });
      });
      
      observer.observe(rootEl, { childList: true });
    } else {
      console.error('Root element not found - critical error!');
    }
  });
})();